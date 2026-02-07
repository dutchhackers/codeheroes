import { Request, Response } from 'express';

// Mock dependencies before imports
const mockStoreRawWebhook = jest.fn().mockResolvedValue(undefined);
const mockFindByEventId = jest.fn();
const mockCreateEvent = jest.fn();
const mockLookupUserId = jest.fn();
const mockGenerateGameActionFromWebhook = jest.fn().mockResolvedValue(null);

jest.mock('@codeheroes/common', () => ({
  logger: {
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  WebhookService: jest.fn().mockImplementation(() => ({
    storeRawWebhook: mockStoreRawWebhook,
  })),
  DatabaseService: jest.fn().mockImplementation(() => ({
    lookupUserId: mockLookupUserId,
  })),
}));

jest.mock('@codeheroes/event', () => ({
  EventService: jest.fn().mockImplementation(() => ({
    findByEventId: mockFindByEventId,
    createEvent: mockCreateEvent,
  })),
}));

jest.mock('../../services/game-action.service', () => ({
  GameActionService: jest.fn().mockImplementation(() => ({
    generateGameActionFromWebhook: mockGenerateGameActionFromWebhook,
  })),
}));

jest.mock('../../providers/provider.factory', () => {
  const mockAdapter = {
    providerName: 'github',
    validateWebhook: jest.fn(),
    extractUserId: jest.fn(),
    mapEventToGameAction: jest.fn(),
  };
  return {
    ProviderFactory: {
      supportsProvider: jest.fn().mockReturnValue(true),
      getProvider: jest.fn().mockReturnValue(mockAdapter),
      initialize: jest.fn(),
    },
    __mockAdapter: mockAdapter,
  };
});

import { processWebhook } from '../webhook-pipeline';
import { ProviderFactory } from '../../providers/provider.factory';

// Access mock adapter
const { __mockAdapter: mockAdapter } = jest.requireMock('../../providers/provider.factory');

function createMockReq(overrides: Partial<Request> = {}): Request {
  return {
    headers: { 'content-type': 'application/json' },
    body: { action: 'opened' },
    ...overrides,
  } as unknown as Request;
}

function createMockRes(): Response & { _status: number; _body: string } {
  const res: any = {
    _status: 0,
    _body: '',
    status(code: number) {
      res._status = code;
      return res;
    },
    send(body: string) {
      res._body = body;
      return res;
    },
  };
  return res;
}

describe('processWebhook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ProviderFactory.supportsProvider as jest.Mock).mockReturnValue(true);
    mockAdapter.validateWebhook.mockReturnValue({
      isValid: true,
      eventType: 'push',
      eventId: 'delivery-123',
    });
    mockAdapter.extractUserId.mockReturnValue('ext-user-1');
    mockFindByEventId.mockResolvedValue(null);
    mockCreateEvent.mockResolvedValue({ id: 'event-1', provider: 'github', source: { id: 'delivery-123', event: 'push' } });
    mockLookupUserId.mockResolvedValue('internal-user-1');
    mockGenerateGameActionFromWebhook.mockResolvedValue({ id: 'ga-1', type: 'code_push' });
  });

  it('should process a valid webhook through the full pipeline', async () => {
    const req = createMockReq();
    const res = createMockRes();

    await processWebhook({ req, res, provider: 'github' });

    expect(res._status).toBe(200);
    expect(res._body).toBe('Event processed successfully');
    expect(mockStoreRawWebhook).toHaveBeenCalledWith(req, 'github', { eventType: 'push', eventId: 'delivery-123' });
    expect(mockFindByEventId).toHaveBeenCalledWith('delivery-123');
    expect(mockCreateEvent).toHaveBeenCalled();
    expect(mockLookupUserId).toHaveBeenCalledWith({ sender: { id: 'ext-user-1' }, provider: 'github' });
    expect(mockGenerateGameActionFromWebhook).toHaveBeenCalledWith({
      payload: req.body,
      provider: 'github',
      eventType: 'push',
      userId: 'internal-user-1',
      eventId: 'delivery-123',
    });
  });

  it('should return 500 for unsupported provider', async () => {
    (ProviderFactory.supportsProvider as jest.Mock).mockReturnValue(false);
    const res = createMockRes();

    await processWebhook({ req: createMockReq(), res, provider: 'strava' });

    expect(res._status).toBe(500);
    expect(res._body).toContain('strava');
  });

  it('should return 400 for invalid webhook', async () => {
    mockAdapter.validateWebhook.mockReturnValue({ isValid: false, error: 'Bad payload' });
    const res = createMockRes();

    await processWebhook({ req: createMockReq(), res, provider: 'github' });

    expect(res._status).toBe(400);
    expect(res._body).toBe('Bad payload');
  });

  it('should return 200 when no external user ID found', async () => {
    mockAdapter.extractUserId.mockReturnValue(undefined);
    const res = createMockRes();

    await processWebhook({ req: createMockReq(), res, provider: 'github' });

    expect(res._status).toBe(200);
    expect(mockStoreRawWebhook).not.toHaveBeenCalled();
  });

  it('should detect duplicate events and skip game action creation', async () => {
    mockFindByEventId.mockResolvedValue({ id: 'existing-event' });
    const res = createMockRes();

    await processWebhook({ req: createMockReq(), res, provider: 'github' });

    expect(res._status).toBe(200);
    expect(res._body).toContain('already processed');
    expect(mockLookupUserId).not.toHaveBeenCalled();
    expect(mockGenerateGameActionFromWebhook).not.toHaveBeenCalled();
  });

  it('should return 200 when no internal user found', async () => {
    mockLookupUserId.mockResolvedValue(undefined);
    const res = createMockRes();

    await processWebhook({ req: createMockReq(), res, provider: 'github' });

    expect(res._status).toBe(200);
    expect(mockGenerateGameActionFromWebhook).not.toHaveBeenCalled();
  });

  it('should return 500 when an error is thrown', async () => {
    mockLookupUserId.mockRejectedValue(new Error('DB connection failed'));
    const res = createMockRes();

    await processWebhook({ req: createMockReq(), res, provider: 'github' });

    expect(res._status).toBe(500);
    expect(res._body).toBe('Internal server error processing webhook');
  });

  it('should pass the correct provider to DatabaseService.lookupUserId', async () => {
    const res = createMockRes();

    await processWebhook({ req: createMockReq(), res, provider: 'azure' });

    expect(mockLookupUserId).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'azure' })
    );
  });

  it('should pass secret and rawBody to validateWebhook when provided', async () => {
    const res = createMockRes();
    const req = createMockReq();
    (req as any).rawBody = Buffer.from('raw-payload');

    await processWebhook({ req, res, provider: 'github', secret: 'my-secret' });

    expect(mockAdapter.validateWebhook).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      'my-secret',
      Buffer.from('raw-payload')
    );
  });

  it('should pass undefined secret and rawBody to validateWebhook when not provided', async () => {
    const res = createMockRes();

    await processWebhook({ req: createMockReq(), res, provider: 'github' });

    expect(mockAdapter.validateWebhook).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      undefined,
      undefined
    );
  });
});

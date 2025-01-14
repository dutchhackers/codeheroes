import { Response } from 'express';
import { HTTP_STATUS } from '../constants/constants';
import { GitHubError } from '../errors/github-event.error';
import { ErrorType } from '../constants/constants';

export class ResponseHandler {
  static success(res: Response, message: string) {
    return res.status(HTTP_STATUS.OK).send(message);
  }

  static handleError(error: unknown, res: Response) {
    if (error instanceof GitHubError) {
      switch (error.type) {
        case ErrorType.VALIDATION:
        case ErrorType.GITHUB_EVENT:
          return this.badRequest(res, error.message);
        case ErrorType.UNSUPPORTED_EVENT:
          return this.success(res, error.message); // Unsupported events are not errors
      }
    }
    
    return this.error(res, error instanceof Error ? error.message : 'Unknown error');
  }

  private static badRequest(res: Response, message: string) {
    return res.status(HTTP_STATUS.BAD_REQUEST).send(message);
  }

  private static error(res: Response, message: string) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send(message);
  }
}

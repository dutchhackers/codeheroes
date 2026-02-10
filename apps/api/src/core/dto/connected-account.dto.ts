import { Expose } from 'class-transformer';

export class ConnectedAccountDto {
  @Expose()
  id: string;

  @Expose()
  provider: string;

  @Expose()
  externalUserId: string;

  @Expose()
  externalUserName?: string;

  @Expose()
  createdAt: string;
}

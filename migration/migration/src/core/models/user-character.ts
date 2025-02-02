import { serializable } from 'serializr';
// import { IUserCharacter } from 'code-heroes-interfaces';

export class UserCharacter {
  @serializable id: string;
  @serializable name: string;
  @serializable since: string;
}

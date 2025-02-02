import { serializable, object } from 'serializr';
// import { IUser } from "code-heroes-interfaces";
import { UserCharacter } from './user-character';

export class User /* implements IUser */ {
  id: string;
  avatar: string;
  xp: number;
  rank: number;

  @serializable
  uid?: string;

  @serializable
  name: string;

  @serializable
  email: string;

  @serializable
  photoUrl: string;

  @serializable
  active: boolean;

  @serializable
  totalXp: number;

  @serializable
  totalScore: number;

  @serializable(object(UserCharacter))
  character: UserCharacter;
}

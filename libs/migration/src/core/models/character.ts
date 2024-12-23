import { serializable, object } from "serializr";

export class Team {
  constructor() {
    //
  }

  @serializable
  id: string;

  @serializable
  name: string;
}

export class Character {
  constructor() {
    //
  }

  active: boolean;

  @serializable
  avatar: string;

  @serializable
  gender: string;

  @serializable
  id: string;

  @serializable
  name: string;

  @serializable
  team: string;

  @serializable
  villain: boolean;

  @serializable
  assignedBy: string;

  public asUserCharacterBase(): any {
    return {
      id: this.id,
      name: this.name,
      avatar: this.avatar,
      gender: this.gender,
    };
  }
}

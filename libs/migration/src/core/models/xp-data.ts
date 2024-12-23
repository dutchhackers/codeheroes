import { serializable } from "serializr";
import { groupBy } from "../utils";

export class UserXp {
  @serializable uid: string;
  @serializable xp: number;
  @serializable timestamp: string;

  constructor(uid: string, xp: number, isoTimestamp?: string) {
    this.uid = uid;
    this.xp = xp;
    this.timestamp = isoTimestamp || new Date().toISOString();
  }
}

export class TotalUserXpPerUser {
  uid: string;
  totalXp: number;
  userXpItems: UserXp[];
}

export class XpData {
  userXpItems: UserXp[];

  constructor() {
    this.userXpItems = [];
  }

  addUserXpItem(uid: string, xp: number) {
    const item = new UserXp(uid, xp);
    this.userXpItems.push(item);
  }

  getXpTotalsPerUser(): TotalUserXpPerUser[] {
    const totalsPerUser: TotalUserXpPerUser[] = [];

    const result = groupBy(this.userXpItems, "uid");
    for (const _key of Object.keys(result)) {
      const totalXp = result[_key].reduce(function (prev, cur) {
        return prev + cur.xp;
      }, 0);

      totalsPerUser.push(<TotalUserXpPerUser>{
        uid: _key,
        totalXp,
        userXpItems: result[_key],
      });
    }
    return totalsPerUser;
  }
}

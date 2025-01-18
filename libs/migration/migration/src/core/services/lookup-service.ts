import { Employee } from '../models';
import { CoreService } from './abstract-service';

export interface ILookupService {
  findEmployeeByGithubLogin(login: string): Promise<Employee>;
  findEmployeeFromTravis(filter: IEmployeeLookupFilter): Promise<Employee>;
}

export interface IEmployeeLookupFilter {
  source?: string;
  username?: string;
  authorName?: string;
  authorEmail?: string;
}

export class LookupService extends CoreService implements ILookupService {
  constructor() {
    super();
  }

  async findEmployeeByGithubLogin(login: string): Promise<Employee> {
    console.log(`[LOOKUP] [findEmployeeByGithubLogin] [login=${login}]`);
    const snapshot = await this.db.collection('employees').where(`gitHubAccounts.${login}`, '==', true).get();

    if (snapshot.docs.length > 0) {
      return docAsEmployee(snapshot.docs[0]);
    }
    return null;
  }

  async findEmployeeFromTravis(filter: IEmployeeLookupFilter): Promise<Employee> {
    console.log(`[LOOKUP] [findEmployeeFromTravis] [filter=${JSON.stringify(filter)}]`);
    const authorName = (filter.authorName || '').toLowerCase();
    const authorEmail = (filter.authorEmail || '').toLowerCase();
    let username = (filter.username || '').toLowerCase();

    let query: any = this.db.collection('employees');

    // Special case e.g. format my_username@users.noreply.github.com
    const parsedUserName = parseGithubUser(authorEmail);
    if (parsedUserName !== null) {
      console.log('found username: ', parsedUserName);
      username = parsedUserName;
    }

    if (username) {
      query = query.where(`gitHubAccounts.${username}`, '==', true);
    }

    const snapshot = await query.limit(50).get();

    if (snapshot.size === 0) {
      return null;
    }

    if (snapshot.size === 1) {
      return docAsEmployee(snapshot.docs[0]);
    }

    // extend with additional search
    const docs = [];
    for (const doc of snapshot.docs) {
      docs.push(doc);
    }

    if (authorName) {
      const docsCollection = docs.filter((p) => p.data().name === authorName);
      if (docsCollection.length > 0) {
        return docAsEmployee(docsCollection[0]);
      }
    }

    if (authorEmail) {
      const docsCollection = docs.filter((p) => p.data().emailAccounts[authorEmail] === true);
      if (docsCollection.length > 0) {
        return docAsEmployee(docsCollection[0]);
      }
    }

    if (authorName) {
      const docsCollection = docs.filter((p) => p.data().gitHubAccounts[authorName] === true);
      if (docsCollection.length > 0) {
        return docAsEmployee(docsCollection[0]);
      }
    }

    return null;
  }
}

function docAsEmployee(doc: any): Employee {
  if (!doc.exists) {
    return null;
  }

  const employee = <Employee>{
    _id: doc.id,
    name: doc.data().name,
    email: doc.data().primaryEmail,
    photoUrl: doc.data().photoUrl,
  };

  console.log(`[LOOKUP] [RESULT] [docAsEmployee] [employee=${JSON.stringify(employee)}]`);
  return Object.assign({}, employee);
}

function parseGithubUser(input: string) {
  if (!input) {
    return null;
  }

  const index = input.indexOf('@users.noreply.github.com');
  if (index > 0) {
    const userName = input.substr(0, index);
    return userName.split('+')[1] ? userName.split('+')[1] : userName;
  }
  return null;
}

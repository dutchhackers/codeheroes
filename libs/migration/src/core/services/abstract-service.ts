import { list, object, deserialize, serializable, alias, primitive, serialize, ClazzOrModelSchema } from "serializr";

import { db } from "../config/firebase.config";

export abstract class CoreService {
  //privates?
  db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = db;
  }

  wrapAll<T>(snapshot: FirebaseFirestore.QuerySnapshot): T[] {
    const docs: T[] = [];
    for (const doc of snapshot.docs) {
      docs.push(<T>doc.data());
    }
    return docs;
  }

  protected async getDocumentAsObject<T>(
    docRef: FirebaseFirestore.DocumentReference,
    modelschema: ClazzOrModelSchema<T>
  ): Promise<T> {
    const snapshot = await docRef.get();
    if (snapshot !== null) {
      return this.serializeDocument<T>(modelschema, snapshot);
    }
    return null;
  }

  protected async getCollectionAsObject<T>(
    collectionRef: FirebaseFirestore.CollectionReference,
    modelschema: ClazzOrModelSchema<T>
  ): Promise<T[]> {
    const snapshot = await collectionRef.get();

    const data: T[] = [];
    for (const doc of snapshot.docs) {
      const obj = Object.assign(deserialize(modelschema, doc.data()), { _docId: doc.id });
      data.push(obj);
    }
    return data;
  }

  protected async firebaseSetDocument(docRef: FirebaseFirestore.DocumentReference, data: any): Promise<any> {
    const _data = cleanInput(data);
    return docRef.set(_data);
  }

  protected serializeDocument<T>(modelschema: ClazzOrModelSchema<T>, snapshot: FirebaseFirestore.DocumentSnapshot): T {
    return Object.assign(deserialize(modelschema, snapshot.data()), { _docId: snapshot.id });
  }
}

function cleanInput(input: any, options: any = {}): any {
  Object.keys(input).forEach(key => (input[key] === undefined ? delete input[key] : ""));
  return input;
}

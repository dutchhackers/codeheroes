import * as ua from "universal-analytics";

export function getVisitor(uid: string): ua.Visitor {
  const visitor = ua("UA-135318399-2");
  visitor.set("uid", uid);
  return visitor;
}

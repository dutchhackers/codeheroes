/* eslint-disable @typescript-eslint/no-namespace */
export * from '../cloud-services/travis';
import * as _codeHeroes from '../code-heroes';

export namespace lib.codeheroes {
  export import models = _codeHeroes.models;
  export import enums = _codeHeroes.enums;
}

/* eslint-disable @typescript-eslint/no-namespace */
import { cloudServicesTravisModels as _travis } from "../cloud-services/travis";
import { cloudServicesGithubModels as _github } from "../cloud-services/github";
import * as _codeHeroes from "../code-heroes";

export namespace lib.cloudservices.github {
  export import models = _github;
}

export namespace lib.cloudservices.travis {
  export import models = _travis;
}

export namespace lib.codeheroes {
  export import models = _codeHeroes.models;
  export import enums = _codeHeroes.enums;
}

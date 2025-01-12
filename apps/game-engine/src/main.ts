import { DEFAULT_REGION } from '@codeheroes/common';
import { setGlobalOptions } from 'firebase-functions/v2';

import { handleEventCreation } from './events';

setGlobalOptions({ region: DEFAULT_REGION });

export { handleEventCreation };

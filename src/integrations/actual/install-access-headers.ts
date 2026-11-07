// Side-effect module: must be imported before anything that loads '@actual-app/api',
// which captures globalThis.fetch when it is first evaluated.
import { installAccessHeaders } from './access-headers.js';

installAccessHeaders();

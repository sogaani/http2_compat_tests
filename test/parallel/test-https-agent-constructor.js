'use strict';
const common = require('../common');
if (!common.hasCrypto)
  common.skip('missing crypto');

common.skip('http1 specific');

const assert = require('assert');
const https = require('https');

assert.ok(https.Agent() instanceof https.Agent);

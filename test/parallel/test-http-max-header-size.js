'use strict';

const common = require('../common');
const assert = require('assert');
const { spawnSync } = require('child_process');
const http = require('http');

common.skip('http1 specific');

assert.strictEqual(http.maxHeaderSize, 8 * 1024);
const child = spawnSync(process.execPath, ['--max-http-header-size=10', '-p',
                                           'http.maxHeaderSize']);
assert.strictEqual(+child.stdout.toString().trim(), 10);

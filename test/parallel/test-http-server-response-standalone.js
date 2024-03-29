'use strict';

const common = require('../common');
const { ServerResponse } = require('http');
const { Writable } = require('stream');
const assert = require('assert');

common.skip('http1 specific');

// Check that ServerResponse can be used without a proper Socket
// Fixes: https://github.com/nodejs/node/issues/14386
// Fixes: https://github.com/nodejs/node/issues/14381

const res = new ServerResponse({
  method: 'GET',
  httpVersionMajor: 1,
  httpVersionMinor: 1
});

let firstChunk = true;

const ws = new Writable({
  write: common.mustCall((chunk, encoding, callback) => {
    if (firstChunk) {
      assert(chunk.toString().endsWith('hello world'));
      firstChunk = false;
    } else {
      assert.strictEqual(chunk.length, 0);
    }
    setImmediate(callback);
  }, 2)
});

res.assignSocket(ws);

res.end('hello world');

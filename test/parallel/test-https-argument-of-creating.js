'use strict';

const common = require('../common');
if (!common.hasCrypto)
  common.skip('missing crypto');

common.skip('http1 specific');

const assert = require('assert');
const https = require('https');
const tls = require('tls');

const dftProtocol = {};

// Test for immutable `opts`
{
  const opts = { foo: 'bar', ALPNProtocols: [ 'http/1.1' ] };
  const server = https.createServer(opts);

  tls.convertALPNProtocols([ 'http/1.1' ], dftProtocol);
  assert.deepStrictEqual(opts, { foo: 'bar', ALPNProtocols: [ 'http/1.1' ] });
  assert.strictEqual(server.ALPNProtocols.compare(dftProtocol.ALPNProtocols),
                     0);
}


// Validate that `createServer` can work with the only argument requestListener
{
  const mustNotCall = common.mustNotCall();
  const server = https.createServer(mustNotCall);

  tls.convertALPNProtocols([ 'http/1.1' ], dftProtocol);
  assert.strictEqual(server.ALPNProtocols.compare(dftProtocol.ALPNProtocols),
                     0);
  assert.strictEqual(server.listeners('request').length, 1);
  assert.strictEqual(server.listeners('request')[0], mustNotCall);
}


// Validate that `createServer` can work with no arguments
{
  const server = https.createServer();

  assert.strictEqual(server.ALPNProtocols.compare(dftProtocol.ALPNProtocols),
                     0);
  assert.strictEqual(server.listeners('request').length, 0);
}

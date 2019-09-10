'use strict';
const common = require('../common');
const assert = require('assert');
const http2 = require('http2');

const server = http2.createServer(common.mustCall(function(req, res) {
  assert.strictEqual(res.writableFinished, false);
  res
    .on('finish', common.mustCall(() => {
      assert.strictEqual(res.writableFinished, true);
      server.close();
    }))
    .end();
}));

server.listen(0);

server.on('listening', common.mustCall(function() {
  const client = http2.connect('http://localhost:' + server.address().port);
  const clientRequest = client.request();
  clientRequest.on('data', () => {});
  clientRequest.on('end', common.mustCall(() => {
    clientRequest.close();
    client.close();
  }));
  assert.strictEqual(clientRequest.writableFinished, false);
  clientRequest.on('finish', common.mustCall(() => {
    assert.strictEqual(clientRequest.writableFinished, true);
  }));
  assert.strictEqual(clientRequest.writableFinished, false);
  clientRequest.end();
}));

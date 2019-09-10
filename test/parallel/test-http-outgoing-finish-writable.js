'use strict';
const common = require('../common');
const assert = require('assert');
const http2 = require('http2');

// Verify that after calling end() on an `OutgoingMessage` (or a type that
// inherits from `OutgoingMessage`), its `writable` property is not set to false

const server = http2.createServer(common.mustCall(function(req, res) {
  assert.strictEqual(res.writable, true);
  assert.strictEqual(res.finished, false);
  assert.strictEqual(res.writableEnded, false);
  res.end();

  // res.writable is set to false after it has finished sending
  // Ref: https://github.com/nodejs/node/issues/15029
  assert.strictEqual(res.writable, true);
  assert.strictEqual(res.finished, true);
  assert.strictEqual(res.writableEnded, true);

  server.close();
}));

server.listen(0);

server.on('listening', common.mustCall(function() {
  const client = http2.connect('http://localhost:' + server.address().port);
  const clientRequest = client.request();
  clientRequest.on('data', ()=>{});
  clientRequest.on('end', ()=>{
    clientRequest.close();
    client.close();
  });
  clientRequest.end();
}));

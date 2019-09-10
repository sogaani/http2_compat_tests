'use strict';
const common = require('../common');
const assert = require('assert');
const http2 = require('http2');

const server = http2.createServer();

server.on('request', function(req, res) {
  res.writeHead(200, { 'foo': 'bar' });
  res.flushHeaders();
  res.flushHeaders(); // Should be idempotent.
});
server.listen(0, common.localhostIPv4, function() {
  const client = http2.connect('http://localhost:' + this.address().port);
  const req = client.request();
  req.on('response', onResponse);
  req.end();

  function onResponse(res) {
    assert.strictEqual(res.foo, 'bar');
    client.destroy();
    server.close();
  }
});

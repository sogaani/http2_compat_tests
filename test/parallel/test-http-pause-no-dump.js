'use strict';

const common = require('../common');
const assert = require('assert');
const http2 = require('http2');

const server = http2.createServer(common.mustCall(function(req, res) {
  req.once('data', common.mustCall(() => {
    req.pause();
    res.writeHead(200);
    res.end();
    res.on('finish', common.mustCall(() => {
      assert(!req._dumped);
    }));
  }));
}));
server.listen(0);

server.on('listening', common.mustCall(function() {
  const client = http2.connect('http://localhost:' + server.address().port);
  const req = client.request({
    ':method': 'POST'
  });
  req.on('response', (res) => {
    assert.strictEqual(res[':status'], 200);
  });
  req.on('data', () => {});
  req.on('end', common.mustCall(() => {
    req.close();
    client.close();
    server.close();
  }));
  req.end(Buffer.allocUnsafe(1024));
}));

'use strict';

const common = require('../common');
const http2 = require('http2');
const assert = require('assert');

const server = http2.createServer(common.mustCall(function(req, res) {
  // When response not finished and stream closed, request shoud emit 'aborted'
  req.on('aborted', common.mustCall(function() {
    assert.strictEqual(this.aborted, true);
    server.close();
  }));
  assert.strictEqual(req.aborted, false);
  res.write('hello');
}));

server.listen(0, common.mustCall(() => {
  const client = http2.connect('http://localhost:' + server.address().port);
  const req = client.request();
  req.end();
  req.on('response', common.mustCall((headers) => {
    req.close();
    client.close();
  }));
}));

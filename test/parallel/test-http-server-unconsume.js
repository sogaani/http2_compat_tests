'use strict';
const common = require('../common');
const assert = require('assert');
const http2 = require('http2');

['on', 'addListener', 'prependListener'].forEach((testFn) => {
  let received = '';

  const server = http2.createServer(function(req, res) {
    res.writeHead(200);
    res.end();

    req.socket[testFn]('data', function(data) {
      received += data;
    });
    req.socket[testFn]('end', function(data) {
      assert.strictEqual(received, 'hello world',
                         `failed for socket.${testFn}`);
    });
    server.close();
  }).listen(0, function() {
    const client = http2.connect('http://localhost:' + this.address().port);
    const req = client.request({
      ':method': 'PUT'
    });
    req.once('response', function(r) {
      req.end('hello world');
      req.resume();
    });
    req.on('end', common.mustCall(() => {
      req.close();
      client.close();
    }));
  });
});

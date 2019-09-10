'use strict';
const common = require('../common');
const assert = require('assert');
const http2 = require('http2');

// Make sure that for HTTP keepalive requests, the .on('end') event is emitted
// on the incoming request object, and that the parser instance does not hold
// on to that request object afterwards.

const server = http2.createServer(common.mustCall((req, res) => {
  req.on('end', common.mustCall(() => {
    const parser = req.socket.parser;
    assert.strictEqual(parser.incoming, req);
    process.nextTick(() => {
      assert.strictEqual(parser.incoming, null);
    });
  }));
  res.end('hello world');
}));

server.unref();

server.listen(0, common.mustCall(() => {
  const client = http2.connect('http://localhost:' + server.address().port);
  const req = client.request({
    ':method': 'POST'
  });
  req.end('hello world');
  req.on('end', common.mustCall(() => {
    process.nextTick(() => {
      server.close();
      req.close();
      client.close();
    });
  }));
  req.resume();
}));

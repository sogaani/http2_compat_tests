'use strict';

const common = require('../common');
const http2 = require('http2');
const assert = require('assert');

const server = http2.createServer(common.mustCall((req, res) => {
  let resClosed = false;

  res.end();
  res.on('finish', common.mustCall(() => {
    assert.strictEqual(resClosed, false);
  }));
  res.on('close', common.mustCall(() => {
    resClosed = true;
  }));
  req.on('close', common.mustCall(() => {
    assert.strictEqual(req._readableState.ended, true);
  }));
  res.socket.on('close', () => server.close());
}));

server.listen(0, common.mustCall(() => {
  const client = http2.connect('http://localhost:' + server.address().port);
  const req = client.request();
  req.end();
  req.on('end', common.mustCall(() => {
    req.close();
    client.close();
  }));
}));

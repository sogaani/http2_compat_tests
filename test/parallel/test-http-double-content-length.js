'use strict';

const common = require('../common');
const http2 = require('http2');
const assert = require('assert');

// The callback should never be invoked because the server
// should respond with a 400 Client Error when a double
// Content-Length header is received.
const server = http2.createServer(common.mustNotCall());
server.on('clientError', common.mustCall((err, socket) => {
  assert(/^Parse Error/.test(err.message));
  assert.strictEqual(err.code, 'HPE_UNEXPECTED_CONTENT_LENGTH');
  socket.destroy();
}));

server.listen(0, () => {
  const client = http2.connect('http://localhost:' + server.address().port);
  const req = client.request({ 'Content-Length': [1, 2] });
  req.on('end', () => {
    req.close();
    client.close();
  })
  req.on('error', common.mustCall(() => {
    server.close();
  }));
  req.end();
});

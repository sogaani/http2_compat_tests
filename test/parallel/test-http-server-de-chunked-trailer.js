'use strict';
const common = require('../common');

// This test ensures that a Trailer header is set only when a chunked transfer
// encoding is used.

const assert = require('assert');
const http2 = require('http2');

const server = http2.createServer(common.mustCall(function(req, res) {
  res.setHeader('Trailer', 'baz');
  const trailerInvalidErr = {
    code: 'ERR_HTTP_TRAILER_INVALID',
    message: 'Trailers are invalid with this transfer encoding',
    type: Error
  };
  common.expectsError(() => res.writeHead(200, { 'Content-Length': '2' }),
                      trailerInvalidErr);
  res.removeHeader('Trailer');
  res.end('ok');
}));
server.listen(0, common.mustCall(() => {
  const client = http2.connect('http://localhost:' + server.address().port);
  const req = client.request();
  req.end();
  req.on('response', common.mustCall((res)=>{
    assert.strictEqual(res[':status'], 200);
    let buf = '';
    req.on('data', (chunk) => {
      buf += chunk;
    }).on('end', common.mustCall(() => {
      assert.strictEqual(buf, 'ok');
      req.close();
      client.close();
    }));
    server.close();
  }));
}));

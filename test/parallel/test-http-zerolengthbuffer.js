'use strict';
// Serving up a zero-length buffer should work.

const common = require('../common');
const http2 = require('http2');

const server = http2.createServer((req, res) => {
  const buffer = Buffer.alloc(0);
  res.writeHead(200, { 'Content-Type': 'text/html',
                       'Content-Length': buffer.length });
  res.end(buffer);
});

server.listen(0, common.mustCall(() => {
  const client = http2.connect('http://localhost:' + server.address().port);
  const req = client.request();
  req.on('response', (res) => {
    req.on('data', common.mustNotCall());
    req.on('end', () => {
      server.close();
      req.close();
      client.close();
    });
  });
}));

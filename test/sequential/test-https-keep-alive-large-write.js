'use strict';
const common = require('../common');
if (!common.hasCrypto)
  common.skip('missing crypto');
const fixtures = require('../common/fixtures');
const http2 = require('http2');

// This test assesses whether long-running writes can complete
// or timeout because the socket is not aware that the backing
// stream is still writing.

const writeSize = 30000000;
let socket;

const server = http2.createSecureServer({
  key: fixtures.readKey('agent1-key.pem'),
  cert: fixtures.readKey('agent1-cert.pem')
}, common.mustCall((req, res) => {
  const content = Buffer.alloc(writeSize, 0x44);

  res.writeHead(200, {
    'Content-Type': 'application/octet-stream',
    'Content-Length': content.length.toString(),
    'Vary': 'Accept-Encoding'
  });

  socket = res.socket;
  const onTimeout = socket._onTimeout;
  socket._onTimeout = common.mustCallAtLeast(() => onTimeout.call(socket), 1);
  res.write(content);
  res.end();
}));
server.on('timeout', common.mustNotCall());

server.listen(0, common.mustCall(() => {
  const client = http2.connect('https://localhost:' + server.address().port,
  { rejectUnauthorized: false });
  const req = client.request();
  req.on('response',(res) => {
    req.once('data', () => {
      socket._onTimeout();
      req.on('data', () => {});
    });
    req.on('end', () => {
      req.close();
      client.close();
      server.close();
    });
  });
}));

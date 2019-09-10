'use strict';
const common = require('../common');

if (!common.hasCrypto)
  common.skip('missing crypto');

const tmpdir = require('../common/tmpdir');
tmpdir.refresh();

const fixtures = require('../common/fixtures');
const http2 = require('http2');
const tls = require('tls');
const options = {
  cert: fixtures.readKey('rsa_cert.crt'),
  key: fixtures.readKey('rsa_private.pem')
};

const server = http2.createSecureServer(options, common.mustCall((req, res) => {
  res.end('bye\n');
  server.close();
}));

function createUnixConnection(authority, options) {
    options.ALPNProtocols = ['h2'];
    options.servername = 'localhost';
    options.allowHalfOpen = true;
    return tls.connect(options.socketPath, options);
};

server.listen(common.PIPE, common.mustCall(() => {
  const client = http2.connect(
    'https://localhost',
    {
      socketPath: common.PIPE,
      createConnection: createUnixConnection,
      rejectUnauthorized: false
    }
  );
  const req = client.request();
  req.end();
  req.on('response', (res)=>{
    req.on('end', common.mustCall(() => {
      req.close();
      client.close();
    }))
    req.resume();
  });
}));

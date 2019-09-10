'use strict';
const common = require('../common');
if (!common.hasCrypto)
  common.skip('missing crypto');

const fixtures = require('../common/fixtures');
const http2 = require('http2');

const options = {
  key: fixtures.readKey('agent1-key.pem'),
  cert: fixtures.readKey('agent1-cert.pem')
};

const connections = {};

const server = http2.createSecureServer(options, (req, res) => {
  const interval = setInterval(() => {
    res.write('data');
  }, 1000);
  interval.unref();
});

server.on('connection', (connection) => {
  const key = `${connection.remoteAddress}:${connection.remotePort}`;
  connection.on('close', () => {
    delete connections[key];
  });
  connections[key] = connection;
});

function shutdown() {
  server.close(common.mustCall());
  for (const key in connections) {
    connections[key].destroy();
    delete connections[key];
  }
}

server.listen(0, () => {
  const client = http2.connect('https://localhost:' + server.address().port, 
  { rejectUnauthorized: false });
  const req = client.request();
  req.end();
  req.on('response', (res)=>{
    req.on('data', () => {});
    setImmediate(shutdown);
  });
});

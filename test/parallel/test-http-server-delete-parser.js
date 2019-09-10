'use strict';

const common = require('../common');

const http2 = require('http2');

const server = http2.createServer(common.mustCall((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.write('okay', common.mustCall(() => {
    delete res.socket.parser;
  }));
  res.end();
}));

server.listen(0, '127.0.0.1', common.mustCall(() => {
  const client = http2.connect('http://localhost:' + server.address().port);
  const req = client.request();
  req.end();
  req.on('end', common.mustCall(() => {
    server.close();
    req.close();
    client.close();
  }));
  req.resume();
}));

server.unref();

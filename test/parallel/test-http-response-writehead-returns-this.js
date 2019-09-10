'use strict';
require('../common');
const http2 = require('http2');
const assert = require('assert');

const server = http2.createServer((req, res) => {
  res.writeHead(200, { 'a-header': 'a-header-value' }).end('abc');
});

server.listen(0, () => {
  const client = http2.connect('http://localhost:' + server.address().port);
  const req = client.request();
  req.end();
  req.on('response', (res)=>{
    assert.strictEqual(res['a-header'], 'a-header-value');
    
    const chunks = [];

    req.on('data', (chunk) => chunks.push(chunk));

    req.on('end', () => {
      assert.strictEqual(Buffer.concat(chunks).toString(), 'abc');
      server.close();
      req.close();
      client.close();
    });
  });
});

'use strict';
const common = require('../common');

// Regression test for https://github.com/nodejs/node/issues/11788.

const assert = require('assert');
const http2 = require('http2');

for (const enc of ['utf8', 'utf16le', 'latin1', 'UTF-8']) {
  const server = http2.createServer(common.mustCall((req, res) => {
    res.setHeader('content-type', `text/plain; charset=${enc}`);
    res.write('helloworld', enc);
    res.end();
  })).listen(0);

  server.on('listening', common.mustCall(() => {
    let body = '';
    let headers;
    const client = http2.connect('http://localhost:' + server.address().port);
    const req = client.request();
    req.setEncoding(enc);
    req.on('data', (data) => body += data);
    req.on('response', common.mustCall((res) => {
      headers = res;
    }));
    req.on('end', common.mustCall(() => {
      assert.strictEqual(headers[':status'], 200);
      assert.strictEqual(headers['content-type'], `text/plain; charset=${enc}`);
      assert.strictEqual(body, 'helloworld');
      req.close();
      client.close();
      server.close();
    }));
  }));
}

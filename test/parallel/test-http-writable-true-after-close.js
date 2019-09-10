'use strict';

const common = require('../common');
const assert = require('assert');
const http2 = require('http2');

// res.writable should not be set to false after it has finished sending
// Ref: https://github.com/nodejs/node/issues/15029

let internal;
let external;
let external_client;

// Proxy server
const server = http2.createServer(common.mustCall((req, res) => {
  const listener = common.mustCall(() => {
    assert.strictEqual(res.writable, true);
    inner.close();
    client.close();
  });

  // on CentOS 5, 'finish' is emitted
  res.on('finish', listener);
  // Everywhere else, 'close' is emitted
  res.on('close', listener);

  const client = http2.connect('http://localhost:' + internal.address().port);
  const inner = client.request();
  inner.on('response',common.mustCall(() => {
    inner.pipe(res);
  }));
})).listen(0, () => {
  // Http server
  internal = http2.createServer((req, res) => {
    res.writeHead(200);
    setImmediate(common.mustCall(() => {
      external.close();
      res.end('Hello World\n');
    }));
  }).listen(0, () => {
    external_client = http2.connect('http://localhost:' + server.address().port);
    external = external_client.request();
    external.on('close', common.mustCall(() => {
      external_client.close();
      server.close();
      internal.close();
    }));
  });
});

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// Flags: --expose-internals
'use strict';
const common = require('../common');
if (!common.hasMultiLocalhost())
  common.skip('platform-specific test.');

const http2 = require('http2');
const assert = require('assert');

const server = http2.createServer((req, res) => {
  console.log(`Connect from: ${req.connection.remoteAddress}`);
  assert.strictEqual(req.connection.remoteAddress, '127.0.0.2');

  req.on('end', () => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`You are from: ${req.connection.remoteAddress}`);
  });
  req.resume();
});

server.listen(0, '127.0.0.1', () => {
  const options = { localAddress: '127.0.0.2' };

  const client = http2.connect('http://localhost:' + server.address().port, options);
  const req = client.request({
    ':path': '/'
  });
  req.on('data', () => req.resume())
  req.on('end', function() {
    client.close();
    req.close();
    server.close();
    process.exit();
  });
  req.end();
});

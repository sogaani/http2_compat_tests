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

'use strict';
require('../common');
const assert = require('assert');

const http2 = require('http2');

const server = http2.createServer(function(request, response) {
  // Removed headers should stay removed, even if node automatically adds them
  // to the output:
  response.removeHeader('connection');
  response.removeHeader('transfer-encoding');
  response.removeHeader('content-length');

  // Make sure that removing and then setting still works:
  response.removeHeader('date');
  response.setHeader('date', 'coffee o clock');

  response.end('beep boop\n');

  this.close();
});

let response = '';

process.on('exit', function() {
  assert.strictEqual(response, 'beep boop\n');
  console.log('ok');
});

server.listen(0, function() {
  const client = http2.connect('http://localhost:' + server.address().port);
  const req = client.request();
  req.on('response', (res)=>{
    assert.strictEqual(res[':status'], 200);
    assert.deepStrictEqual(res, Object.assign(Object.create(null), { ':status': 200, date: 'coffee o clock' }));

    req.setEncoding('ascii');
    req.on('data', function(chunk) {
      response += chunk;
    });
    req.on('end', function(chunk) {
      req.close();
      client.close();
    })
  });
});

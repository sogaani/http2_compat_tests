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
const common = require('../common');
const assert = require('assert');
const http2 = require('http2');

let requests = 0;
let responses = 0;

const headers = {};
const N = 100;
for (let i = 0; i < N; ++i) {
  headers[`key${i}`] = i;
}

const maxAndExpected = [ // for server
  [50, 50],
  [1500, 104],
  [0, N + 4]
];
let max = maxAndExpected[requests][0];
let expected = maxAndExpected[requests][1];

const server = http2.createServer(function(req, res) {
  assert.strictEqual(Object.keys(req.headers).length, expected);
  if (++requests < maxAndExpected.length) {
    max = maxAndExpected[requests][0];
    expected = maxAndExpected[requests][1];
    server.maxHeadersCount = max;
  }
  res.writeHead(200, headers);
  res.end();
});
server.maxHeadersCount = max;

server.listen(0, function() {
  doRequest();

  function doRequest() {
    const client = http2.connect('http://localhost:' + server.address().port);
    const req = client.request(headers);
    req.on('data', () => req.resume())
    req.on('end', function() {
      client.close();
      req.close();
      if (requests < maxAndExpected.length) {
        doRequest();
      } else {
        server.close();
      }
    });
    req.end();
  }
});

process.on('exit', function() {
  assert.strictEqual(responses, maxAndExpected.length);
});

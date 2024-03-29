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

// Verify that ServerResponse.writeHead() works as setHeader.
// Issue 5036 on github.

const s = http2.createServer(common.mustCall((req, res) => {
  res.setHeader('test', '1');

  // toLowerCase() is used on the name argument, so it must be a string.
  // Non-String header names should throw
  common.expectsError(
    () => res.setHeader(0xf00, 'bar'),
    {
      code: 'ERR_INVALID_HTTP_TOKEN',
      type: TypeError,
      message: 'Header name must be a valid HTTP token ["3840"]'
    }
  );

  // Undefined value should throw, via 979d0ca8
  common.expectsError(
    () => res.setHeader('foo', undefined),
    {
      code: 'ERR_HTTP_INVALID_HEADER_VALUE',
      type: TypeError,
      message: 'Invalid value "undefined" for header "foo"'
    }
  );

  res.writeHead(200, { Test: '2' });

  common.expectsError(() => {
    res.writeHead(100, {});
  }, {
    code: 'ERR_HTTP_HEADERS_SENT',
    type: Error,
    message: 'Cannot render headers after they are sent to the client'
  });

  res.end();
}));

s.listen(0, common.mustCall(runTest));

function runTest() {
  const client = http2.connect('http://localhost:' + this.address().port);
  const req = client.request();
  req.on('response', common.mustCall((res) => {
    assert.strictEqual(res.test, '2');
    req.resume();
    req.on('end', common.mustCall(() => {
      s.close();
      req.close();
      client.close();
    }));
  }));
}

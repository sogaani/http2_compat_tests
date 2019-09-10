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

// Test that the DELETE, PATCH and PURGE verbs get passed through correctly

['DELETE', 'PATCH', 'PURGE'].forEach(function(method, index) {
  const server = http2.createServer(common.mustCall(function(req, res) {
    assert.strictEqual(req.method, method);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write('hello ');
    res.write('world\n');
    res.end();
  }));
  server.listen(0);

  server.on('listening', common.mustCall(function() {
    let server_response = '';
    const client = http2.connect('http://localhost:' + server.address().port);
    const req = client.request({
      ':method': method
    });
    req.on('data', (chunk) => {
      server_response += chunk;
    });
    req.on('end', common.mustCall(() => {
      assert.strictEqual(server_response, 'hello world\n');
      req.close();
      client.close();
      server.close();
    }));
  }));
});

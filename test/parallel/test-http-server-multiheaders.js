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
// Verify that the HTTP server implementation handles multiple instances
// of the same header as per RFC2616: joining the handful of fields by ', '
// that support it, and dropping duplicates for other fields.

const common = require('../common');
const assert = require('assert');
const http2 = require('http2');

const srv = http2.createServer(common.mustCall((req, res) => {
  assert.strictEqual(req.headers.accept, 'abc, def, ghijklmnopqrst');
  //assert.strictEqual(req.headers.host, 'foo');
  assert.strictEqual(req.headers['www-authenticate'], 'foo, bar, baz');
  assert.strictEqual(req.headers['proxy-authenticate'], 'foo, bar, baz');
  assert.strictEqual(req.headers['x-foo'], 'bingo');
  assert.strictEqual(req.headers['x-bar'], 'banjo, bango');
  assert.strictEqual(req.headers['sec-websocket-protocol'], 'chat, share');
  assert.strictEqual(req.headers['sec-websocket-extensions'],
                     'foo; 1, bar; 2, baz');
  assert.strictEqual(req.headers.constructor, 'foo, bar, baz');

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('EOF');

  srv.close();
}));

srv.listen(0, function() {
  const client = http2.connect('http://localhost:' + this.address().port);
  const req = client.request({
    'accept': ['abc', 'def'],
    'Accept': 'ghijklmnopqrst',
    /*
    'host': 'foo',
    'Host': 'bar',
    'hOst': 'baz',
    */
    'www-authenticate': 'foo',
    'WWW-Authenticate': 'bar',
    'WWW-AUTHENTICATE': 'baz',
    'proxy-authenticate': 'foo',
    'Proxy-Authenticate': 'bar',
    'PROXY-AUTHENTICATE': 'baz',
    'x-foo': 'bingo',
    'x-bar': ['banjo', 'bango'],
    'sec-websocket-protocol': ['chat', 'share'],
    'sec-websocket-extensions': ['foo; 1', 'bar; 2', 'baz'],
    'constructor': ['foo', 'bar', 'baz'],
  });
  req.on('end', common.mustCall(() => {
    req.close();
    client.close();
  }));
  req.resume();
});

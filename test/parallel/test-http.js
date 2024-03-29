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
const url = require('url');

const expectedRequests = ['/hello', '/there', '/world'];

const server = http2.createServer(common.mustCall((req, res) => {
  assert.strictEqual(expectedRequests.shift(), req.url);

  switch (req.url) {
    case '/hello':
      assert.strictEqual(req.method, 'GET');
      assert.strictEqual(req.headers.accept, '*/*');
      assert.strictEqual(req.headers.foo, 'bar');
      assert.strictEqual(req.headers.cookie, 'foo=bar; bar=baz; baz=quux');
      break;
    case '/there':
      assert.strictEqual(req.method, 'PUT');
      assert.strictEqual(req.headers.cookie, 'node=awesome; ta=da');
      break;
    case '/world':
      assert.strictEqual(req.method, 'POST');
      assert.deepStrictEqual(req.headers.cookie, 'abc=123; def=456; ghi=789');
      break;
    default:
      assert(false, `Unexpected request for ${req.url}`);
  }

  if (expectedRequests.length === 0)
    server.close();

  req.on('end', () => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write(`The path was ${url.parse(req.url).pathname}`);
    res.end();
  });
  req.resume();
}, 3));
server.listen(0);

server.on('listening', () => {
  let expectedResponse = 3;
  const client = http2.connect('http://localhost:' + server.address().port);
  const req = client.request({
    ':path': '/hello',
    Accept: '*/*',
    Foo: 'bar',
    Cookie: [ 'foo=bar', 'bar=baz', 'baz=quux' ]
  });
  req.on('response', (res) => {
    assert.strictEqual(res[':status'], 200);
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', common.mustCall(() => {
      expectedResponse--;
      assert.strictEqual(body, 'The path was /hello');
      req.close();
      if (expectedResponse === 0){
        client.close();
      }
    }));
  });

  setTimeout(common.mustCall(() => {
    const req = client.request({
      ':method': 'PUT',
      ':path': '/there',
      'Cookie': ['node=awesome', 'ta=da']
    });
    req.on('response', common.mustCall((res) => {
      assert.strictEqual(res[':status'], 200);
      let body = '';
      req.setEncoding('utf8');
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', common.mustCall(() => {
        expectedResponse--;
        assert.strictEqual(body, 'The path was /there');
        req.close();
        if (expectedResponse === 0){
          client.close();
        }
      }));
    }));
    req.end();
  }), 1);

  setTimeout(common.mustCall(() => {
    const req = client.request({
      ':method': 'POST',
      ':path': '/world',
      'Cookie': ['abc=123', 'def=456', 'ghi=789']
    });
    req.on('response', common.mustCall((res) => {
      assert.strictEqual(res[':status'], 200);
      let body = '';
      req.setEncoding('utf8');
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', common.mustCall(() => {
        expectedResponse--;
        assert.strictEqual(body, 'The path was /world');
        req.close();
        if (expectedResponse === 0){
          client.close();
        }
      }));
    }));
    req.end();
  }), 2);
});

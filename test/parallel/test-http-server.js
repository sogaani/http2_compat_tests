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
const url = require('url');
const qs = require('querystring');

// TODO: documentation does not allow Array as an option, so testing that
// should fail, but currently http.Server does not typecheck further than
// if `option` is `typeof object` - so we don't test that here right now
const invalid_options = [ 'foo', 42, true ];

invalid_options.forEach((option) => {
  assert.throws(() => {
    new http2.createServer(option);
  }, {
    code: 'ERR_INVALID_ARG_TYPE'
  });
});

let request_number = 0;
let requests_sent = 0;
let server_response = '';

const server = http2.createServer(function(req, res) {
  res.id = request_number;
  req.id = request_number++;

  if (req.id === 0) {
    assert.strictEqual(req.method, 'GET');
    assert.strictEqual(url.parse(req.url).pathname, '/hello');
    assert.strictEqual(qs.parse(url.parse(req.url).query).hello, 'world');
    assert.strictEqual(qs.parse(url.parse(req.url).query).foo, 'b==ar');
  }

  if (req.id === 1) {
    assert.strictEqual(req.method, 'POST');
    assert.strictEqual(url.parse(req.url).pathname, '/quit');
  }

  if (req.id === 2) {
    assert.strictEqual(req.headers['x-x'], 'foo');
  }

  if (req.id === 3) {
    assert.strictEqual(req.headers['x-x'], 'bar');
    this.close();
  }
  setTimeout(function() {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write(url.parse(req.url).pathname);
    res.end();
  }, 1);

});
server.listen(0);

server.httpAllowHalfOpen = true;

server.on('listening', function() {
  const client = http2.connect('http://localhost:' + this.address().port);
  const req = client.request({
    ':path': '/hello?hello=world&foo=b==ar'
  });
  requests_sent += 1;

  const next = function(chunk) {
    server_response += chunk;
    let req;
    if (requests_sent === 1) {
      req = client.request({
        ':method': 'POST',
        ':path': '/quit'
      });
      req.on('data', next);
      req.end();
      req.on('end', () => {
        this.close();
      });
      requests_sent += 1;
    }
    if (requests_sent === 2) {
      req = client.request({
        'X-X': 'foo'
      });
      req.on('data', next);
      req.end();
      req.on('end', () => {
        this.close();
      });

      req = client.request({
        'X-X': 'bar'
      });
      req.on('data', next);
      req.end();
      req.on('end', () => {
        this.close();
        client.close();
      });
      requests_sent += 2;
    }
  }

  req.on('data', next);
});

process.on('exit', function() {
  assert.strictEqual(request_number, 4);
  assert.strictEqual(requests_sent, 4);

  const hello = new RegExp('/hello');
  assert.ok(hello.test(server_response));

  const quit = new RegExp('/quit');
  assert.ok(quit.test(server_response));
});

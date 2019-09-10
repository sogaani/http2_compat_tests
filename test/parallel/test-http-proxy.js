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

common.skip('TODO');

const cookies = [
  'session_token=; path=/; expires=Sun, 15-Sep-2030 13:48:52 GMT',
  'prefers_open_id=; path=/; expires=Thu, 01-Jan-1970 00:00:00 GMT'
];

const headers = { 'content-type': 'text/plain',
                  'set-cookie': cookies,
                  'hello': 'world' };

const backend = http2.createServer(function(req, res) {
  console.error('backend request');
  res.writeHead(200, headers);
  res.write('hello world\n');
  res.end();
});

const proxy = http2.createServer(function(req, res) {
  console.error(`proxy req headers: ${JSON.stringify(req.headers)}`);
  const client = http2.connect('http://localhost:' + backend.address().port);
  const proxy_req = client.request({
    ':path': url.parse(req.url).pathname
  });
  proxy_req.on('response', function(proxy_res) {
    console.error(`proxy res headers: ${JSON.stringify(proxy_res.headers)}`);

    assert.strictEqual(proxy_res.hello, 'world');
    assert.strictEqual(proxy_res['content-type'], 'text/plain');
    assert.deepStrictEqual(proxy_res['set-cookie'], cookies);

    res.writeHead(proxy_res[':status'], proxy_res);

    proxy_req.on('data', function(chunk) {
      res.write(chunk);
    });

    proxy_req.on('end', function() {
      res.end();
      console.error('proxy res');
      client.close();
      req.close();
    });
  });
  proxy_req.end();
});

let body = '';

let nlistening = 0;
function startReq() {
  nlistening++;
  if (nlistening < 2) return;

  const client = http2.connect('http://localhost:' + proxy.address().port);
  const req = client.request({
    ':path': '/test'
  });
  req.on('response', function(res) {
    console.error('got res');
    assert.strictEqual(res[':status'], 200);

    assert.strictEqual(res.hello, 'world');
    assert.strictEqual(res['content-type'], 'text/plain');
    assert.deepStrictEqual(res['set-cookie'], cookies);

    req.setEncoding('utf8');
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', function() {
      client.close();
      req.close();
      proxy.close();
      backend.close();
      console.error('closed both');
    });
  });
  console.error('client req');
}

console.error('listen proxy');
proxy.listen(0, startReq);

console.error('listen backend');
backend.listen(0, startReq);

process.on('exit', function() {
  assert.strictEqual(body, 'hello world\n');
});

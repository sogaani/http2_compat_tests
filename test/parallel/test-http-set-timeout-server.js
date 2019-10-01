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

const tests = [];

function test(fn) {
  if (!tests.length)
    process.nextTick(run);
  tests.push(common.mustCall(fn));
}

function run() {
  const fn = tests.shift();
  if (fn) {
    fn(run);
  }
}

test(function serverTimeout(cb) {
  const server = http2.createServer();
  server.listen(common.mustCall(() => {
    const s = server.setTimeout(50, common.mustCall((socket) => {
      socket.destroy();
      server.close();
      cb();
    }));
    //assert.ok(s instanceof http2.Http2Server);
    const client = http2.connect('http://localhost:' + server.address().port);
    const req = client.request();
    req.end();
    req.on('error', common.mustCall());
  }));
});

test(function serverRequestTimeout(cb) {
  const server = http2.createServer(common.mustCall((req, res) => {
    // Just do nothing, we should get a timeout event.
    const s = req.setTimeout(50, common.mustCall((socket) => {
      socket.destroy();
      server.close();
      cb();
    }));
    //assert.ok(s instanceof http2.Http2ServerRequest);
  }));
  server.listen(common.mustCall(() => {
    const client = http2.connect('http://localhost:' + server.address().port);
    const req = client.request({
      ':method': 'POST'
    });
    req.on('error', common.mustCall());
    req.write('Hello');
    // req is in progress
  }));
});

test(function serverResponseTimeout(cb) {
  const server = http2.createServer(common.mustCall((req, res) => {
    // Just do nothing, we should get a timeout event.
    const s = res.setTimeout(50, common.mustCall((socket) => {
      socket.destroy();
      server.close();
      cb();
    }));
    assert.ok(s instanceof http2.Http2ServerResponse);
  }));
  server.listen(common.mustCall(() => {
    const client = http2.connect('http://localhost:' + server.address().port);
    const req = client.request();
    req.end();
    req.on('error', common.mustCall());
  }));
});

test(function serverRequestNotTimeoutAfterEnd(cb) {
  const server = http2.createServer(common.mustCall((req, res) => {
    // Just do nothing, we should get a timeout event.
    const s = req.setTimeout(50, common.mustNotCall());
    assert.ok(s instanceof http2.Http2ServerRequest);
    res.on('timeout', common.mustCall());
  }));
  server.on('timeout', common.mustCall((socket) => {
    socket.destroy();
    server.close();
    cb();
  }));
  server.listen(common.mustCall(() => {
    const client = http2.connect('http://localhost:' + server.address().port);
    const req = client.request();
    req.end();
    req.on('error', common.mustCall());
  }));
});

test(function serverResponseTimeoutWithPipeline(cb) {
  let caughtTimeout = '';
  let secReceived = false;
  process.on('exit', () => {
    assert.strictEqual(caughtTimeout, '/2');
  });
  const server = http2.createServer((req, res) => {
    if (req.url === '/2')
      secReceived = true;
    if (req.url === '/1') {
      res.end();
      return;
    }
    const s = res.setTimeout(50, () => {
      caughtTimeout += req.url;
    });
    assert.ok(s instanceof http2.Http2ServerResponse);
  });
  server.on('timeout', common.mustCall((socket) => {
    if (secReceived) {
      socket.destroy();
      server.close();
      cb();
    }
  }));
  server.listen(common.mustCall(() => {
    const client = http2.connect('http://localhost:' + server.address().port);
    const req1 = client.request({
      ':path': '/1'
    });
    req1.end();
    const req2 = client.request({
      ':path': '/2'
    });
    req2.end();
    const req3 = client.request({
      ':path': '/3'
    });
    req3.end();
  }));
});

test(function idleTimeout(cb) {
  // Test that the an idle connection invokes the timeout callback.
  const server = http2.createServer();
  const s = server.setTimeout(50, common.mustCall((socket) => {
    socket.destroy();
    server.close();
    cb();
  }));
  assert.ok(s instanceof http2.Http2Server);
  server.listen(common.mustCall(() => {
    const client = http2.connect('http://localhost:' + server.address().port);
    const req = client.request({
      ':path': '/1'
    });
    req.end();
    req.on('error', common.mustCall());
  }));
});

test(function fastTimeout(cb) {
  let connectionHandlerInvoked = false;
  let timeoutHandlerInvoked = false;
  let connectionSocket;

  function invokeCallbackIfDone() {
    if (connectionHandlerInvoked && timeoutHandlerInvoked) {
      connectionSocket.destroy();
      server.close();
      cb();
    }
  }

  const server = http2.createServer(common.mustCall((req, res) => {
    req.on('timeout', common.mustNotCall());
    res.end();
    connectionHandlerInvoked = true;
    invokeCallbackIfDone();
  }));
  const s = server.setTimeout(1, common.mustCall((socket) => {
    connectionSocket = socket;
    timeoutHandlerInvoked = true;
    invokeCallbackIfDone();
  }));
  assert.ok(s instanceof http2.Http2Server);
  server.listen(common.mustCall(() => {
    const client = http2.connect('http://localhost:' + server.address().port);
    const req = client.request({
      ':path': '/1'
    });
    req.end();
    req.on('error', common.mustCall());
  }));
});

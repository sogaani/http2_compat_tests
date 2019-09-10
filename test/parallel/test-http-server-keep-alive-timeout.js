'use strict';

const common = require('../common');
const http2 = require('http2');
const net = require('net');

const tests = [];

function test(fn) {
  if (!tests.length) {
    process.nextTick(run);
  }
  tests.push(fn);
}

function run() {
  const fn = tests.shift();
  if (fn) fn(run);
}

function done(server, socket, cb) {
  socket.destroy();
  server.close(cb);
}

function serverTest(withPipeline, cb) {
  let gotAll = false;
  let timedout = false;
  const server = http2.createServer(common.mustCall((req, res) => {
    if (withPipeline)
      res.end();
    if (req.url === '/3') {
      gotAll = true;
      if (timedout)
        done(server, req.socket, cb);
    }
  }, 3));
  server.setTimeout(500, common.mustCallAtLeast((socket) => {
    // End this test and call `run()` for the next test (if any).
    timedout = true;
    if (gotAll)
      done(server, socket, cb);
  }));
  server.keepAliveTimeout = 50;
  server.listen(0, common.mustCall(() => {
    const client = http2.connect('http://localhost:' + server.address().port);
    client.request({
      ':path': '/1'
    });
    client.request({
      ':path': '/2'
    });
    client.request({
      ':path': '/3'
    });
  }));
}

test(function serverEndKeepAliveTimeoutWithPipeline(cb) {
  serverTest(true, cb);
});

test(function serverNoEndKeepAliveTimeoutWithPipeline(cb) {
  serverTest(false, cb);
});

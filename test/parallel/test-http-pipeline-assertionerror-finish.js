'use strict';
const common = require('../common');
const Countdown = require('../common/countdown');

// This test ensures that Node.js doesn't crash with an AssertionError at
// `ServerResponse.resOnFinish` because of an out-of-order 'finish' bug in
// pipelining.
// https://github.com/nodejs/node/issues/2639

const http2 = require('http2');

const COUNT = 10;

const countdown = new Countdown(COUNT, () => {
  client.close();
});

let client;

const server = http2
  .createServer(
    common.mustCall((req, res) => {
      // Close the server, we have only one TCP connection anyway
      server.close();
      res.writeHead(200);
      res.write('data');

      setTimeout(function() {
        res.end();
      }, (Math.random() * 100) | 0);
    }, COUNT)
  )
  .listen(0, function() {
    client = http2.connect('http://localhost:' + this.address().port);

    for (let i = 0; i < COUNT; ++i) {
      const req = client.request();
      req.on('end', function() {
        req.close();
        countdown.dec();
      });
      req.end();
      req.resume();
    }
  });

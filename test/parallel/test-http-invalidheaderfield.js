'use strict';
const common = require('../common');

const assert = require('assert');
const EventEmitter = require('events');
const http2 = require('http2');

const ee = new EventEmitter();
let count = 2;

const server = http2.createServer(function(req, res) {
  res.setHeader('testing_123', 123);
  assert.throws(function() {
    res.setHeader('testing 123', 123);
  }, TypeError);
  res.end('');
});

let client;

server.listen(0, function() {
  client = http2.connect('http://localhost:' + this.address().port);
  const req = client.request({
    ':path': '/world'
  });
  req.on('end', function() {
    ee.emit('done');
    req.close();
  });
  req.end();

  /*
  assert.throws(
    function() {
      const req2 = client.request({
        'testing 123': 123
      });
      req2.on('end', common.mustNotCall(() => {
        req2.close();
      }));
      req2.end();
    },
    function(err) {
      ee.emit('done');
      if (err instanceof TypeError) return true;
    }
  );
  */

  // Should not throw.
  const req3 = client.request({
    'testing_123': 123
  });
  req3.on('end', () => {
    ee.emit('done');
    req3.close();
  });
  req.end();
});

ee.on('done', function() {
  if (--count === 0) {
    client.close();
    server.close();
  }
});

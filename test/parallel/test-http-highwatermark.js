'use strict';
const common = require('../common');
const assert = require('assert');
const net = require('net');
const http2 = require('http2');

// These test cases to check socketOnDrain where needPause becomes false.
// When send large response enough to exceed highWaterMark, it expect the socket
// to be paused and res.write would be failed.
// And it should be resumed when outgoingData falls below highWaterMark.

let requestReceived = 0;

const server = http2.createServer(function(req, res) {
  const id = ++requestReceived;
  const enoughToDrain = req.connection.writableHighWaterMark;
  const body = 'x'.repeat(enoughToDrain * 100);

  if (id === 1) {
    // Case of needParse = false
    req.connection.once('pause', common.mustCall(() => {
      assert(req.connection._paused, '_paused must be true because it exceeds' +
                                     'highWaterMark by second request');
    }));
  } else {
    // Case of needParse = true
    const resume = req.connection.parser.resume.bind(req.connection.parser);
    req.connection.parser.resume = common.mustCall((...args) => {
      const paused = req.connection._paused;
      assert(!paused, '_paused must be false because it become false by ' +
                      'socketOnDrain when outgoingData falls below ' +
                      'highWaterMark');
      return resume(...args);
    });
  }
  assert(!res.write(body), 'res.write must return false because it will ' +
                           'exceed highWaterMark on this call');
                           console.log(requestReceived);
  res.end();
}).on('listening', () => {
  const client = http2.connect('http://localhost:' + server.address().port);
  const req = client.request();
  const req2 = client.request();
  req.on('end', function() {
    req.close();
    req2.close();
    client.close();
    server.close();
  });
  req2.on('data', ()=> setImmediate(()=>{
        req.resume();
        req2.resume();
  }));
  req.end();
  req2.end();
});

server.listen(0);

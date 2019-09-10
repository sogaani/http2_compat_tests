'use strict';

const common = require('../common');

const assert = require('assert');
const http2 = require('http2');

let time = Date.now();
let intervalWasInvoked = false;
const TIMEOUT = common.platformTimeout(200);

const server = http2.createServer((req, res) => {
  server.close();

  res.writeHead(200);
  res.flushHeaders();

  req.setTimeout(TIMEOUT, () => {
    if (!intervalWasInvoked)
      return common.skip('interval was not invoked quickly enough for test');
    assert.fail('Request timeout should not fire');
  });

  req.resume();
  req.once('end', () => {
    res.end();
  });
});

server.listen(0, common.mustCall(() => {
  const client = http2.connect('http://localhost:' + server.address().port);
  const req = client.request({
    ':method': 'POST'
  });
  req.on('response',(res) => {
    const interval = setInterval(() => {
      intervalWasInvoked = true;
      // If machine is busy enough that the interval takes more than TIMEOUT ms
      // to be invoked, skip the test.
      const now = Date.now();
      if (now - time > TIMEOUT)
        return common.skip('interval is not invoked quickly enough for test');
      time = now;
      req.write('a');
    }, common.platformTimeout(25));
    setTimeout(() => {
      clearInterval(interval);
      req.end();
    }, TIMEOUT);
    req.on('end', () => {
      req.close();
      client.close();
    });
  });
  req.write('.');
}));

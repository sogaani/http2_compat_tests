'use strict';
const common = require('../common');
const assert = require('assert');
const http2 = require('http2');
const Countdown = require('../common/countdown');

const MAX_REQUESTS = 13;
let reqNum = 0;

function test(res, header, code) {
  common.expectsError(() => {
    res.writeHead(header);
  }, {
    code: 'ERR_HTTP_INVALID_STATUS_CODE',
    type: RangeError,
    message: `Invalid status code: ${code}`
  });
}

const server = http2.createServer(common.mustCall(function(req, res) {
  switch (reqNum) {
    case 0:
      test(res, -1, '-1');
      break;
    case 1:
      test(res, Infinity, 'Infinity');
      break;
    case 2:
      test(res, NaN, 'NaN');
      break;
    case 3:
      test(res, {}, '{}');
      break;
    case 4:
      test(res, 99, '99');
      break;
    case 5:
      test(res, 1000, '1000');
      break;
    case 6:
      test(res, '1000', '1000');
      break;
    case 7:
      test(res, null, 'null');
      break;
    case 8:
      test(res, true, 'true');
      break;
    case 9:
      test(res, [], '[]');
      break;
    case 10:
      test(res, 'this is not valid', 'this is not valid');
      break;
    case 11:
      test(res, '404 this is not valid either', '404 this is not valid either');
      break;
    case 12:
      common.expectsError(() => { res.writeHead(); },
                          {
                            code: 'ERR_HTTP_INVALID_STATUS_CODE',
                            type: RangeError,
                            message: 'Invalid status code: undefined'
                          });
      this.close();
      break;
    default:
      throw new Error('Unexpected request');
  }
  res.statusCode = 200;
  res.end();
}, MAX_REQUESTS));
server.listen();

const countdown = new Countdown(MAX_REQUESTS, () => server.close());

server.on('listening', function makeRequest() {
  const client = http2.connect('http://localhost:' + server.address().port);
  const req = client.request();
  req.end();
  req.on('response', (res)=>{
    assert.strictEqual(res[':status'], 200);
    req.on('end', common.mustCall(() => {
      req.close();
      client.close();
      countdown.dec();
      reqNum = MAX_REQUESTS - countdown.remaining;
      if (countdown.remaining > 0)
        makeRequest.call(this);
    }));
    req.resume();
  });
});

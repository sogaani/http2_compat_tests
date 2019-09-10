// Spec documentation http://httpwg.github.io/specs/rfc7231.html#header.expect
'use strict';
const common = require('../common');
const assert = require('assert');
const http2 = require('http2');

const tests = [417, 417];

let testsComplete = 0;
let testIdx = 0;

const s = http2.createServer((req, res) => {
  throw new Error('this should never be executed');
});

s.listen(0, nextTest);

function nextTest() {
  const options = {
    port: s.address().port,
    headers: { 'Expect': 'meoww' }
  };

  if (testIdx === tests.length) {
    return s.close();
  }

  const test = tests[testIdx];

  if (testIdx > 0) {
    s.on('checkExpectation', common.mustCall((req, res) => {
      res.statusCode = 417;
      res.end();
    }));
  }

  const client = http2.connect('http://localhost:' + options.port);
  const req = client.request(options.headers);
  req.on('response', (response) => {
    console.log(`client: expected status: ${test}`);
    console.log(`client: statusCode: ${response[':status']}`);
    assert.strictEqual(response[':status'], test);
    // statusMessage is not supported by HTTP/2 (RFC7540 8.1.2.4)
    // assert.strictEqual(response.statusMessage, 'Expectation Failed');

    req.on('end', () => {
      testsComplete++;
      testIdx++;
      req.close();
      client.close();
      nextTest();
    });
    req.resume();
  });
  req.end();
}


process.on('exit', () => {
  assert.strictEqual(testsComplete, 2);
});

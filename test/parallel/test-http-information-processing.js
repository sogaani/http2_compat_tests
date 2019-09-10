'use strict';
require('../common');
const assert = require('assert');
const http2 = require('http2');
const Countdown = require('../common/countdown');

const test_res_body = 'other stuff!\n';
const countdown = new Countdown(3, () => server.close());

const server = http2.createServer((req, res) => {
  console.error('Server sending informational message #1...');
  res.writeProcessing();
  console.error('Server sending informational message #2...');
  res.writeProcessing();
  console.error('Server sending full response...');
  res.writeHead(200, {
    'Content-Type': 'text/plain',
    'ABCD': '1'
  });
  res.end(test_res_body);
});

server.listen(0, function() {
  const client = http2.connect('http://localhost:' + server.address().port);
  const req = client.request({
    ':path': '/world'
  });
  req.on('end', function() {
    req.close();
    client.close();
  });
  req.end();
  console.error('Client sending request...');

  let body = '';

  req.on('information', function(res) {
    console.error('Client got 102 Processing...');
    countdown.dec();
  });

  req.on('response', function(res) {
    // Check that all 102 Processing received before full response received.
    assert.strictEqual(countdown.remaining, 1);
    assert.strictEqual(res[':status'], 200,
                       `Final status code was ${res[':status']}, not 200.`);
    req.setEncoding('utf8');
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', function() {
      console.error('Got full response.');
      assert.strictEqual(body, test_res_body);
      assert.ok('abcd' in res.headers);
      countdown.dec();
    });
  });
});

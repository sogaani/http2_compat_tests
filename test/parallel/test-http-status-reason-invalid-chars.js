'use strict';

const common = require('../common');
const assert = require('assert');
const http2 = require('http2');
const Countdown = require('../common/countdown');

function explicit(req, res) {
  assert.throws(() => {
    res.writeHead(200, 'OK\r\nContent-Type: text/html\r\n');
  }, /Invalid character in statusMessage/);

  assert.throws(() => {
    res.writeHead(200, 'OK\u010D\u010AContent-Type: gotcha\r\n');
  }, /Invalid character in statusMessage/);

  res.statusMessage = 'OK';
  res.end();
}

function implicit(req, res) {
  assert.throws(() => {
    res.statusMessage = 'OK\r\nContent-Type: text/html\r\n';
    res.writeHead(200);
  }, /Invalid character in statusMessage/);
  res.statusMessage = 'OK';
  res.end();
}

const server = http2.createServer((req, res) => {
  if (req.url === '/explicit') {
    explicit(req, res);
  } else {
    implicit(req, res);
  }
}).listen(0, common.mustCall(() => {
  const hostname = 'localhost';
  const countdown = new Countdown(2, () => {
    client.close();
    server.close();
  });
  const url = `http://${hostname}:${server.address().port}`;
  const check = common.mustCall((res) => {
    assert.notStrictEqual(res['content-type'], 'text/html');
    assert.notStrictEqual(res['content-type'], 'gotcha');
    countdown.dec();
  }, 2);
  const client = http2.connect(url);
  const req1 = client.request({
    ':path': '/explicit'
  });
  req1.on('response',check);
  req1.on('end', function() {
    req1.close();
  });
  req1.resume();
  const req2 = client.request({
    ':path': '/implicit'
  });
  req2.on('response',check);
  req2.on('end', function() {
    req2.close();
  });
  req2.resume();
}));

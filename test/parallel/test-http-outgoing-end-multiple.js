'use strict';
const common = require('../common');
const assert = require('assert');
const http2 = require('http2');

const server = http2.createServer(common.mustCall(function(req, res) {
  res.end('testing ended state', common.mustCall());
  res.end(common.mustCall());
  res.on('finish', common.mustCall(() => {
    res.end(common.mustCall((err) => {
      assert.strictEqual(err.code, 'ERR_STREAM_ALREADY_FINISHED');
      server.close();
    }));
  }));
}));

server.listen(0);

server.on('listening', common.mustCall(function() {
  const client = http2.connect('http://localhost:' + server.address().port);
  const req = client.request();
  req.on('data', ()=>{});
  req.on('end', ()=>{
    req.close();
    client.close();
  });
  req.end();
}));

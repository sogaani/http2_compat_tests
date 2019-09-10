'use strict';

const common = require('../common');
const http2 = require('http2');

// Fix for https://github.com/nodejs/node/issues/14368

const server = http2.createServer(handle);

function handle(req, res) {
  res.on('error', common.mustCall((err) => {
    console.log("here2");
    common.expectsError({
      code: 'ERR_STREAM_WRITE_AFTER_END',
      type: Error
    })(err);
    server.close();
  }));

  res.write('hello');
  res.end();

  setImmediate(common.mustCall(() => {
    res.write('world');
  }));
}

server.listen(0, common.mustCall(() => {
  const client = http2.connect('http://localhost:' + server.address().port);
  const req = client.request();
  req.end();
  req.resume();
  req.on('end', function() {
    req.close();
    client.close();
  });
}));

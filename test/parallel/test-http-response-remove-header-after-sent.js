'use strict';
const common = require('../common');
const http2 = require('http2');

const server = http2.createServer((req, res) => {
  res.removeHeader('header1', 1);
  res.write('abc');
  common.expectsError(
    () => res.removeHeader('header2', 2),
    {
      code: 'ERR_HTTP_HEADERS_SENT',
      type: Error,
      message: 'Cannot remove headers after they are sent to the client'
    }
  );
  res.end();
});

server.listen(0, () => {
  const client = http2.connect('http://localhost:' + server.address().port);
  const req = client.request();
  req.end();
  req.resume();
  req.on('end', common.mustCall(() => {
    req.close();
    client.close();
    server.close();
  }));
});

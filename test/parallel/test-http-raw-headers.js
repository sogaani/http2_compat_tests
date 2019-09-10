// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';
require('../common');
const assert = require('assert');

const http2 = require('http2');

http2.createServer(function(req, res) {
  const expectRawHeaders = [
    'Host',
    `localhost:${this.address().port}`,
    //'transfer-ENCODING',
    //'CHUNKED',
    'x-BaR',
    'yoyoyo',
    //'Connection',
    //'close'
  ];
  const expectHeaders = {
    'host': `localhost:${this.address().port}`,
    //'transfer-encoding': 'CHUNKED',
    'x-bar': 'yoyoyo',
    //'connection': 'close'
  };
  const expectRawTrailers = [
    'x-bAr',
    'yOyOyOy',
    'x-baR',
    'OyOyOyO',
    'X-bAr',
    'yOyOyOy',
    'X-baR',
    'OyOyOyO'
  ];
  const expectTrailers = { 'x-bar': 'yOyOyOy, OyOyOyO, yOyOyOy, OyOyOyO' };

  this.close();

  assert.deepStrictEqual(req.rawHeaders, expectRawHeaders);
  assert.deepStrictEqual(req.headers, expectHeaders);

  req.on('end', function() {
    assert.deepStrictEqual(req.rawTrailers, expectRawTrailers);
    assert.deepStrictEqual(req.trailers, expectTrailers);
  });

  req.resume();
  res.setHeader('Trailer', 'x-foo');
  res.addTrailers([
    ['x-fOo', 'xOxOxOx'],
    ['x-foO', 'OxOxOxO'],
    ['X-fOo', 'xOxOxOx'],
    ['X-foO', 'OxOxOxO']
  ]);
  res.end('x f o o');
}).listen(0, function() {
  const client = http2.connect('http://localhost:' + this.address().port);
  const req = client.request({
    ':method': 'POST',
    //'transfer-ENCODING': 'CHUNKED',
    'x-BaR': 'yoyoyo'
  },
  {
    waitForTrailers: true
  });
  req.end('y b a r');
  req.on('wantTrailers', () => {
    req.sendTrailers({
      'x-bAr': 'yOyOyOy',
      'x-baR': 'OyOyOyO',
      'X-bAr': 'yOyOyOy',
      'X-baR': 'OyOyOyO'
    });
  });
  req.on('response', function(res) {
    const expectHeaders = {
      'trailer': 'x-foo',
      'date': null,
      'connection': 'close',
      'transfer-encoding': 'chunked'
    };
    res.date = null;
    //assert.deepStrictEqual(res, expectHeaders);
    req.on('end', function() {
      client.close();
      req.close();
    });
    req.resume();
  });
  req.on('trailers', (trailers) => {
    
    console.log("here")
    const expectTrailers = { 'x-foo': 'xOxOxOx, OxOxOxO, xOxOxOx, OxOxOxO' };
    //assert.deepStrictEqual(trailers, expectTrailers);
    console.log('ok');
  })
});

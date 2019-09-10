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
const common = require('../common');
if (!common.hasCrypto)
  common.skip('missing crypto');

const assert = require('assert');
const fixtures = require('../common/fixtures');
const http2 = require('http2');

const options = {
  key: fixtures.readKey('rsa_private.pem'),
  cert: fixtures.readKey('rsa_cert.crt'),
  requestCert: true,
  rejectUnauthorized: false
};

const webIdUrl = 'URI:http://example.com/#me';
const modulus = fixtures.readKey('rsa_cert_foafssl_b.modulus', 'ascii').replace(/\n/g, '');
const exponent = fixtures.readKey('rsa_cert_foafssl_b.exponent', 'ascii').replace(/\n/g, '');

const body = 'hello world\n';
let cert;

const server = http2.createSecureServer(options, common.mustCall(function(req, res) {
  console.log('got request');

  cert = req.connection.getPeerCertificate();

  assert.strictEqual(cert.subjectaltname, webIdUrl);
  assert.strictEqual(cert.exponent, exponent);
  assert.strictEqual(cert.modulus, modulus);
  res.writeHead(200, { 'content-type': 'text/plain' });
  res.end(body);
}));

server.listen(0, function() {
  const options = {
    rejectUnauthorized: false,
    key: fixtures.readKey('rsa_private_b.pem'),
    cert: fixtures.readKey('rsa_cert_foafssl_b.crt'),
  }
  const client = http2.connect(
    'https://localhost:' + this.address().port,
    options
  );
  const req = client.request();
  req.end();
  req.on('response', (res)=>{
    let contents = '';
    req.on('data', (chunk) => { contents += chunk });
    req.on('end', () => {
      assert.strictEqual(body, contents);
      req.close();
      client.close();
      server.close();
    })
  });
});

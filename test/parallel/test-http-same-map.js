// Flags: --allow_natives_syntax
'use strict';

const common = require('../common');
const assert = require('assert');
const http2 = require('http2');

const server =
    http2.createServer(onrequest).listen(0, common.localhostIPv4, () => next(0));

function onrequest(req, res) {
  res.end('ok');
  onrequest.requests.push(req);
  onrequest.responses.push(res);
}
onrequest.requests = [];
onrequest.responses = [];

let client;

function next(n) {
  client = client ? client : http2.connect('http://localhost:' + server.address().port);
  const req = client.request();
  req.end();
  req.on('response', ()=>{
    onresponse(n, req)
  });
}

function onresponse(n, req) {
  req.resume();

  if (n < 3) {
    req.once('end', () => {
      req.close();
      next(n + 1);
    });
  } else {
    req.close();
    client.close();
    server.close();
  }
}

function allSame(list) {
  assert(list.length >= 2);
  // Use |elt| in no-op position to pacify eslint.
  for (const elt of list) elt, eval('%DebugPrint(elt)');
  for (const elt of list) elt, assert(eval('%HaveSameMap(list[0], elt)'));
}

process.on('exit', () => {
  eval('%CollectGarbage(0)');
  // TODO(bnoordhuis) Investigate why the first IncomingMessage ends up
  // with a deprecated map.  The map is stable after the first request.
  allSame(onrequest.requests.slice(1));
  allSame(onrequest.responses);
});

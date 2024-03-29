# http2 compat tests
Nodejs http2 compatibility layer tests. Clarify differences between `http.IncomingMessage http.OutgoingMessage` and `http2.Http2ServerRequest http2.Http2ServerResponse`.

## Run Tests
```
python3 tools/test.py -j 4 parallel sequential
```

## Exposed difference between http2 compat and http

- [ ] `http2.Http2ServerRequest` does not have `req.connection.bytesWritten`.  test:[parallel/test-http-byteswritten.js](https://github.com/sogaani/http2_compat_tests/blob/master/test/parallel/test-http-byteswritten.js),[parallel/test-https-byteswritten.js](https://github.com/sogaani/http2_compat_tests/blob/master/test/parallel/test-https-byteswritten.js)
- [ ] If `http2.Http2ServerRequest.pause` is called, `http2.Http2ServerRequest.socket` never emit 'data' event.  test:[parallel/test-http-dump-req-when-res-ends.js](https://github.com/sogaani/http2_compat_tests/blob/master/test/parallel/test-http-dump-req-when-res-ends.js)
- [ ] `http2.Http2ServerResponse.writeHead` with 'HTTP/1 Connection specific headers'(e.g. "Transfer-Encoding":"chunked") causes error:ERR_HTTP2_INVALID_CONNECTION_HEADERS.  test:[parallel/test-http-head-request.js](https://github.com/sogaani/http2_compat_tests/blob/master/test/parallel/test-http-head-request.js)
- [ ] `http2.Http2ServerResponse` does not have `res.writeProcessing`.  test:[parallel/test-http-information-processing.js](https://github.com/sogaani/http2_compat_tests/blob/master/test/parallel/test-http-information-processing.js)
- [ ] `http2.Http2ServerResponse.writeHead` with a spaced header name does not cause error.  test:[parallel/test-http-invalidheaderfield.js](https://github.com/sogaani/http2_compat_tests/blob/master/test/parallel/test-http-invalidheaderfield.js)
- [ ] `http2.Http2ServerRequest` does not have `req.connection.parser`.  test:[parallel/test-http-highwatermark.js](https://github.com/sogaani/http2_compat_tests/blob/master/test/parallel/test-http-highwatermark.js),[parallel/test-http-server-keepalive-end.js](https://github.com/sogaani/http2_compat_tests/blob/master/test/parallel/test-http-server-keepalive-end.js)
- [ ] `http2.Http2ServerResponse.end` calls callback before satisfying condition of 'finish' events.  test:[parallel/test-http-outgoing-finish.js](https://github.com/sogaani/http2_compat_tests/blob/master/test/parallel/test-http-outgoing-finish.js)
- [ ] `http2.Http2ServerResponse.getHeaders` returns headers which is not initialized by `Object.create(null)`
test:[parallel/test-http-mutable-headers.js](https://github.com/sogaani/http2_compat_tests/blob/master/test/parallel/test-http-mutable-headers.js)
- [ ] `http2.Http2ServerResponse` does not have `res.writableHighWaterMark`.  test:[parallel/test-http-outgoing-properties.js](https://github.com/sogaani/http2_compat_tests/blob/master/test/parallel/test-http-outgoing-properties.js) related issue:https://github.com/nodejs/node/issues/28969
- [ ] `http2.Http2ServerResponse` does not have `res.writableLength`.  test:[parallel/test-http-outgoing-properties.js](https://github.com/sogaani/http2_compat_tests/blob/master/test/parallel/test-http-outgoing-properties.js) related issue:https://github.com/nodejs/node/issues/28969
- [ ] `http2.Http2ServerResponse` does not have `res.writableFinished`.  test:[parallel/test-http-outgoing-writableFinished.js](https://github.com/sogaani/http2_compat_tests/blob/master/test/parallel/test-http-outgoing-writableFinished.js)  related issue:https://github.com/nodejs/node/issues/29230
- [ ] `http2.Http2ServerRequest.headers` returns headers which is initialized by `Object.create(null)`
test:[parallel/test-http-raw-headers.js](https://github.com/sogaani/http2_compat_tests/blob/master/test/parallel/test-http-raw-headers.js)
- [ ] `http2.Http2ServerResponse.removeHeader` cannot remove a header nodejs automatically adds(e.g. 'date').  test:[parallel/test-http-remove-header-stays-removed.js](https://github.com/sogaani/http2_compat_tests/blob/master/test/parallel/test-http-remove-header-stays-removed.js)
- [ ] `http2.Http2ServerResponse.write` after `http2.Http2ServerResponse.end` returns `false`.  test:[parallel/test-http-res-write-after-end.js](https://github.com/sogaani/http2_compat_tests/blob/master/test/parallel/test-http-res-write-after-end.js)
- [ ] `http2.Http2ServerResponse.write` after `http2.Http2ServerResponse.end` does not emmit 'error'.  test:[parallel/test-http-res-write-after-end.js](https://github.com/sogaani/http2_compat_tests/blob/master/test/parallel/test-http-res-write-after-end.js),[parallel/test-http-server-write-after-end.js](https://github.com/sogaani/http2_compat_tests/blob/master/test/parallel/test-http-server-write-after-end.js)
- [ ] `http2.Http2ServerResponse.write` with array input does not cause an error.  test:[parallel/test-http-res-write-after-end.js](https://github.com/sogaani/http2_compat_tests/blob/master/test/parallel/test-http-res-write-after-end.js)
- [ ] `http2.Http2ServerResponse.end` with array input does not cause an error.  test:[parallel/test-http-res-write-after-end.js](https://github.com/sogaani/http2_compat_tests/blob/master/test/parallel/test-http-res-write-after-end.js)
- [ ] `http2.Http2ServerResponse`'s error code start with 'ERR_HTTP2'.  test:[parallel/test-http-response-add-header-after-sent.js](https://github.com/sogaani/http2_compat_tests/blob/master/test/parallel/test-http-response-add-header-after-sent.js),[parallel/test-http-response-remove-header-after-sent.js](https://github.com/sogaani/http2_compat_tests/blob/master/test/parallel/test-http-response-remove-header-after-sent.js),[parallel/test-http-response-statuscode.js](https://github.com/sogaani/http2_compat_tests/blob/master/test/parallel/test-http-response-statuscode.js),[parallel/test-http-write-head.js](https://github.com/sogaani/http2_compat_tests/blob/master/test/parallel/test-http-write-head.js)
- [ ] `http2.Http2ServerResponse.setHeader` and `http2.Http2ServerResponse.writeHead` with multiple value of 'content-length' causes an error.  test:[parallel/test-http-response-multi-content-length.js](https://github.com/sogaani/http2_compat_tests/blob/master/test/parallel/test-http-response-multi-content-length.js)
- [ ] `http2.Http2ServerResponse.setHeader` and `http2.Http2ServerResponse.writeHead` with multiple value of 'content-type' or other headers expected single value causes an error.  test:[parallel/test-http-response-multiheaders.js](https://github.com/sogaani/http2_compat_tests/blob/master/test/parallel/test-http-response-multiheaders.js)
- [ ] `http2.Http2ServerResponse.writeHead` with invalid character does not cause error.  test:[parallel/test-http-response-splitting.js](https://github.com/sogaani/http2_compat_tests/blob/master/test/parallel/test-http-response-splitting.js)
- [ ] `http2.Http2ServerResponse` sending 'Trailer' header without 'transfer encoding: chunked' does not cause error.  test:[parallel/test-http-server-de-chunked-trailer.js](https://github.com/sogaani/http2_compat_tests/blob/master/test/parallel/test-http-server-de-chunked-trailer.js)
- [ ] `http2.Http2ServerResponse.writeHead` cannot set multiple value of header with nested array.  test:[parallel/test-http-set-cookies.js](https://github.com/sogaani/http2_compat_tests/blob/master/test/parallel/test-http-set-cookies.js)
- [ ] `http2.Http2ServerResponse.setTimeout` does not pass a socket to cb function.  test:[parallel/test-http-set-timeout-server.js](https://github.com/sogaani/http2_compat_tests/blob/master/test/parallel/test-http-set-timeout-server.js)
- [ ] `http2.Http2ServerResponse.writeHead` with invalid status message does not cause an error.  test:[parallel/test-http-status-reason-invalid-chars.js](https://github.com/sogaani/http2_compat_tests/blob/master/test/parallel/test-http-status-reason-invalid-chars.js)
- [ ] `stream.pipe(http2.Http2ServerResponse)` eventually emmits both 'finish' and 'close' events.  test:[parallel/test-http-writable-true-after-close.js](https://github.com/sogaani/http2_compat_tests/blob/master/test/parallel/test-http-writable-true-after-close.js)
- [ ] `http2.Http2ServerResponse.end` does not execute callback when  `http2.Http2ServerResponse.end` has already been called.  test:[parallel/test-http-outgoing-end-multiple.js](https://github.com/sogaani/http2_compat_tests/blob/master/test/parallel/test-http-outgoing-end-multiple.js) related PR:https://github.com/nodejs/node/pull/29229
- [ ] After `http2.Http2ServerRequest.connection.setTimeout` is called, 'timeout' event is not emitted.  test:[parallel/test-http-set-timeout.js](https://github.com/sogaani/http2_compat_tests/blob/master/test/parallel/test-http-set-timeout.js)

## Other exposed issues
- [ ] `http2.connect` with http does pass options to `net.connect`.  test:[parallel/test-http-localaddress.js](https://github.com/sogaani/http2_compat_tests/blob/master/test/parallel/test-http-localaddress.js) [related issue](https://github.com/nodejs/node/issues/29811)
- [ ] Call `socket.destroy` while sending data cause a segmentation fault.(Only with WSL)  test:test/[parallel/test-https-close.js](https://github.com/sogaani/http2_compat_tests/blob/master/test/parallel/test-https-close.js)
- [ ] `http2.Http2Server` does not have `server.maxHeadersCount`.  test:[parallel/test-http-max-headers-count.js](https://github.com/sogaani/http2_compat_tests/blob/master/test/parallel/test-http-max-headers-count.js)

## Protcol Level Difference
* http2 semicoloned headers
    * 

* http2 does not support '100-continue'

* http1 Connect Method
    * http2 support it by :connect header

* No Content-Length with body

* Host header replaced by :authority
    * https://http2.github.io/http2-spec/#HttpRequest

* 'Connection' Header has no efect with http2

* Upgrade to the websocket
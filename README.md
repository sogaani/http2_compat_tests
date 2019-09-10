# http2 compat tests
Nodejs http2 compatibility layer tests. Clarify differences between `http.IncomingMessage http.OutgoingMessage` and `http2.Http2ServerRequest http2.Http2ServerResponse`.

## Run Tests
```
python3 tools/test.py -j 4 parallel sequential
```

## Protcol Level Difference
* http2 semicoloned headers
    * 

* http1 Connect Method
    * http2 support it by :connect header

* No Content-Length with body

* Host header replaced by :authority
    * https://http2.github.io/http2-spec/#HttpRequest

* 'Connection' Header has no efect with http2

* Upgrade to the websocket
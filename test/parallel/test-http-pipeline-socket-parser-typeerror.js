'use strict';
require('../common');

// This test ensures that Node.js doesn't crash because of a TypeError by
// checking in `connectionListener` that the socket still has the parser.
// https://github.com/nodejs/node/issues/3508

const http2 = require('http2');

let once = false;
let first = null;
let second = null;

const chunk = Buffer.alloc(1024, 'X');

let size = 0;

let more;
let done;

const server = http2
  .createServer((req, res) => {
    if (!once) server.close();
    once = true;

    if (first === null) {
      first = res;
      return;
    }
    if (second === null) {
      second = res;
      res.write(chunk);
    } else {
      res.end(chunk);
    }
    size += res.outputSize;
    if (size <= req.socket.writableHighWaterMark) {
      more();
      return;
    }
    done();
  })
  .listen(0, () => {
    const client = http2.connect('http://localhost:' + server.address().port);
    let count = 0;

    more = () => {
      count++;
      const req = client.request();
      req.on('end', function() {
        count--;
        req.close();
        if(count == 0){
        console.log(count);
          client.close();
        }
      });
      req.end();
      req.resume();
    }
    done = () => {
      setImmediate(()=>{
        second.end(chunk);
        first.end('hello');
      });
    };
    more();
    more();
  });

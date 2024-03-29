'use strict';
const common = require('../common');

common.skip('http1 specific');

const { OutgoingMessage } = require('http');

const warn = 'OutgoingMessage.prototype._headerNames is deprecated';
common.expectWarning('DeprecationWarning', warn, 'DEP0066');

{
  // Tests for _headerNames get method
  const outgoingMessage = new OutgoingMessage();
  outgoingMessage._headerNames;
}

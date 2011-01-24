var EventEmitter = require('events').EventEmitter;

var LastFmRequest = exports.LastFmRequest = function() {
  EventEmitter.call(this);
};

LastFmRequest.prototype = Object.create(EventEmitter.prototype);

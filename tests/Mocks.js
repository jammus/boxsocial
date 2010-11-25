var LastFmNode = require('lastfm').LastFmNode;
var RecentTracksStream = require('lastfm/recenttracks-stream').RecentTracksStream;
var EventEmitter = require("events").EventEmitter;

var MockLastFm = function(){
    this.readRequests = 0;
};

MockLastFm.prototype.writeRequest = function(){};
MockLastFm.prototype.readRequest = function(){ this.readRequests++; };

MockLastFm.prototype.stream = function(host) {
    return new RecentTracksStream(this, host);
};

MockLastFm.prototype.info = function() {};


exports.MockLastFm = MockLastFm;

var MockLastFmSession = function(lastfm, user, key){
    this.nowPlayingCalls = 0;
    this.nowPlaying = null;
    this.scrobbleCalls = 0;
    this.latsScrobbled = null;
    this.user = user;
    this.key = key;
};

MockLastFmSession.prototype.update = function(method, track) {
    if (method == "nowplaying") {
        this.nowPlayingCalls++;
        this.nowPlaying = track;
    }
    else if (method == "scrobble") {
        this.scrobbleCalls++;
        this.lastScrobbled = track;
    }
}

exports.MockLastFmSession = MockLastFmSession;

var MockClient = function(options) {
    var that = this;
    EventEmitter.call(this);
    Object.keys(options).forEach(function(key) {
        that[key] = options[key];
    });
}

MockClient.prototype = Object.create(EventEmitter.prototype);

exports.MockClient = MockClient;

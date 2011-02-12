var LastFmNode = require('lastfm').LastFmNode;
var LastFmRequest = require('lastfm/lastfm-request');
var RecentTracksStream = require('lastfm/recenttracks-stream');
var EventEmitter = require("events").EventEmitter;
var Guest = require("../lib/guest").Guest;
var fakes = require("./fakes");

var MockLastFm = function(){
    this.readRequests = 0;
};

MockLastFm.prototype.write = function() {
    return new fakes.LastFmRequest();
};

MockLastFm.prototype.read = function() {
    this.readRequests++;
    return new fakes.LastFmRequest();
};

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

exports.createGuest = function(lastfm, user, key) {
    return new Guest(lastfm, new LastFmSession(lastfm, user, key));
}

exports.MockRequest = function() {
    return {
        session: {
             destroy: function() {}
        },
        params: {},
        headers: function(key) {}
    };
}

exports.MockResponse = function() {
    return {
        redirect: function() {}
    };
};

exports.MockError = function(code) {
    return {
        message: code == "404" ? "ENOENT" : ""
    }
}

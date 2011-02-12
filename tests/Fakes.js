var RecentTracksStream = require('lastfm/recenttracks-stream');
var EventEmitter = require("events").EventEmitter;
var fakes = require("./fakes");

var LastFm = function(){
    this.readRequests = 0;
};

LastFm.prototype.write = function() {
    return new fakes.LastFmRequest();
};

LastFm.prototype.read = function() {
    this.readRequests++;
    return new fakes.LastFmRequest();
};

LastFm.prototype.stream = function(host) {
    return new RecentTracksStream(this, host);
};

LastFm.prototype.info = function() {};


exports.LastFm = LastFm;

var LastFmSession = function(lastfm, user, key){
    this.nowPlayingCalls = 0;
    this.nowPlaying = null;
    this.scrobbleCalls = 0;
    this.lastScrobbled = null;
    this.user = user;
    this.key = key;
};

LastFmSession.prototype.update = function(method, track) {
    if (method == "nowplaying") {
        this.nowPlayingCalls++;
        this.nowPlaying = track;
    }
    else if (method == "scrobble") {
        this.scrobbleCalls++;
        this.lastScrobbled = track;
    }
}

exports.LastFmSession = LastFmSession;

var Client = function(options) {
    var that = this;
    EventEmitter.call(this);
    Object.keys(options).forEach(function(key) {
        that[key] = options[key];
    });
}

Client.prototype = Object.create(EventEmitter.prototype);

exports.Client = Client;

exports.Request = function() {
    return {
        session: {
             destroy: function() {}
        },
        params: {},
        headers: function(key) {}
    };
}

exports.Response = function() {
    return {
        redirect: function() {}
    };
};

exports.Error = function(code) {
    return {
        message: code == "404" ? "ENOENT" : ""
    }
}

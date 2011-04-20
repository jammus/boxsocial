var EventEmitter = require("events").EventEmitter;
var _ = require("underscore");

var Party = exports.Party = function(lastfm, stream) {
    this.host = stream.user;
    this.guests = [];
    this.nowPlaying = null;
    this.nowPlayingInfo = null;
    this.recentPlays = [];

    var that = this;
    var nowPlayingStartTime;

    EventEmitter.call(this);
    initStreamListeners();
    resetStartTime();

    this.addGuest = function(guest) {
        var guestIsTheHost = that.host == guest.session.user;
        var guestIsAlreadyHere = that.hasGuest(guest);
        if (guestIsTheHost || guestIsAlreadyHere) {
            return;
        }

        if (!stream.isStreaming) {
            stream.start();
        }

        that.guests.push(guest);

        if (that.nowPlaying) {
            updateGuest("nowplaying", guest, {
                track: that.nowPlaying,
                duration: that.nowPlayingInfo ? millisecondsToSeconds(that.nowPlayingInfo.duration) : null
            });
        }
        that.emit("guestsUpdated", that.guests);
    };

    this.hasGuest = function(guest) {
        return _(that.guests).any(function(g) {
            var usernamesMatch = g.session.user.toLowerCase() === guest.session.user.toLowerCase();
            var sessionKeysMatch = (guest.session.key && g.session.key.toLowerCase() === guest.session.key.toLowerCase());
            return usernamesMatch || sessionKeysMatch;
        });
    };

    this.removeGuest = function(guest) {
        that.guests = _(that.guests).reject(function(g) {
            return g.session.key == guest.session.key;
        });

        that.emit("guestsUpdated", that.guests);

        if (that.guests.length == 0) {
            that.finish();
        }
    };

    this.finish = function() {
        while (that.guests.length) {
            that.guests.pop();
        }

        stream.removeAllListeners("scrobbled");
        stream.removeAllListeners("nowPlaying");
        stream.removeAllListeners("stoppedPlaying");

        stream.stop();

        that.emit("finished", that);
    };

    function initStreamListeners() {
        stream.on("nowPlaying", function(track) {
            that.nowPlaying = track;
            that.nowPlayingInfo = null
            resetStartTime();

            lastfm.info("track", {
                track: track,
                handlers: {
                    success: function(trackInfo) {
                        that.nowPlayingInfo = trackInfo;
                        updateGuests("nowplaying", {
                            track: track,
                            duration: trackInfo.duration / 1000
                        });
                    },
                    error: function(error) {
                        updateGuests("nowplaying", {
                            track: track
                        });
                    }
                }
            });

            that.emit("trackUpdated", track);
        });

        stream.on("scrobbled", function(track) {
            updateGuests("scrobble", { 
                track: track,
                timestamp: nowPlayingStartTime
            });
            addRecentPlay(track);
            that.emit("recentPlaysUpdated", that.recentPlays);
        });

        stream.on("stoppedPlaying", function(track) {
            that.nowPlaying = null;
            that.emit("trackUpdated");
        });

        stream.on("error", function(error) {
            that.emit("error", error);
        });
    }

    function addRecentPlay(track) {
        if (that.recentPlays.length >= 5) {
            that.recentPlays.splice(4);
        }
        that.recentPlays.unshift(track);
    }

    function updateGuests(method, options) {
        _(that.guests).each(function(guest) {
            updateGuest(method, guest, options);
        });
    }

    function updateGuest(method, guest, options) {
        options.handlers = options.handlers || {};
        options.handlers.error = function(error) {
            that.emit("error", new Error("Error updating " + method + " for " + guest.session.user));
        };
        lastfm.update(method, guest.session, options);
    };

    function resetStartTime() {
        var currentTime = (new Date()).getTime();
        nowPlayingStartTime = millisecondsToSeconds(currentTime);
    };

    function millisecondsToSeconds(ms) {
        return Math.round(ms / 1000);
    }
};

Party.prototype = Object.create(EventEmitter.prototype);

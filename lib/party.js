var EventEmitter = require("events").EventEmitter;

var Party = exports.Party = function(lastfm, stream) {
    this.host = stream.user;
    this.guests = [];
    this.nowPlaying = null;
    this.nowPlayingInfo = null;
    this.recentPlays = [];

    var self = this;
    var nowPlayingStartTime = millisecondsToSeconds((new Date()).getTime());
    EventEmitter.call(this);
    initStreamListeners();

    this.addGuest = function(guest) {
        if (self.host == guest.session.user || self.hasGuest(guest)) {
            return;
        }

        if (!stream.isStreaming) {
            stream.start();
        }

        self.guests.push(guest);

        if (self.nowPlaying) {
            updateGuest("nowplaying", guest, {
                track: self.nowPlaying,
                duration: self.nowPlayingInfo ? millisecondsToSeconds(self.nowPlayingInfo.duration) : null
            });
        }

        self.emit("guestsUpdated", self.guests);
    };

    this.hasGuest = function(guest) {
        for (var x in self.guests) {
            if (self.guests[x].session.user.toLowerCase() === guest.session.user.toLowerCase() || (guest.session.key && self.guests[x].session.key.toLowerCase() === guest.session.key.toLowerCase())) {
                return true;
            }
        }
        return false
    };

    this.removeGuest = function(guest) {
        for (var x in self.guests) {
            if (self.guests[x].session.key == guest.session.key) { 
                self.guests.splice(x, 1);
            }
        }

        self.emit("guestsUpdated", self.guests);

        if (self.guests.length == 0) {
            self.finish();
        }
    };

    this.finish = function() {
        while (self.guests.length)
            self.guests.pop();

        stream.removeAllListeners("scrobbled");
        stream.removeAllListeners("nowPlaying");
        stream.removeAllListeners("stoppedPlaying");
        stream.removeAllListeners("error");

        stream.stop();

        self.emit("finished", self);
    };

    function initStreamListeners() {
        stream.on("nowPlaying", function(track) {
            self.nowPlaying = track;
            self.nowPlayingInfo = null
            nowPlayingStartTime = millisecondsToSeconds((new Date()).getTime());

            lastfm.info("track", {
                track: track,
                success: function(trackInfo) {
                    self.nowPlayingInfo = trackInfo;
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
            });

            self.emit("trackUpdated", track);
        });

        stream.on("scrobbled", function(track) {
            updateGuests("scrobble", { 
                track: track,
                timestamp: nowPlayingStartTime
            });
            if (self.recentPlays.length >= 5)
                self.recentPlays.splice(4);
            self.recentPlays.unshift(track);
        });

        stream.on("stoppedPlaying", function(track) {
            self.nowPlaying = null;
            self.emit("trackUpdated");
        });

        stream.on("error", function(error) {
            self.emit("error", error);
        });
    }

    function updateGuests(method, options) {
        self.guests.forEach(function(guest) { updateGuest(method, guest, options); });
    }

    function updateGuest(method, guest, options) {
        if (!options.error) {
            options.error = function(error) {
                self.emit("error", new Error("Error updating " + method + " for " + guest.session.user));
            };
        }
        lastfm.update(method, guest.session, options);
    };

    function millisecondsToSeconds(ms) {
        return Math.round(ms / 1000);
    }
};

Party.prototype = Object.create(EventEmitter.prototype);

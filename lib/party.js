var EventEmitter = require("events").EventEmitter
  , _ = require("underscore");

var Party = exports.Party = function(lastfm, host) {
    EventEmitter.call(this);

    var that = this,
        stream;

    startParty();

    this.host = host;

    this.guests = [];

    this.nowPlaying = null;

    this.recentPlays = [];

    this.addGuest = function(guest) {
        addGuest(guest);
    };

    this.hasGuest = function(guest) {
        return hasGuest(guest);
    };

    this.removeGuest = function(guest) {
        removeGuest(guest);
    };

    this.finish = function() {
        endParty();
    };

    function startParty() {
        startMonitoringHost();
    }

    function startMonitoringHost() {
        stream = lastfm.stream(host, { autostart: true });
        stream.on("nowPlaying", hostIsPlaying);
        stream.on("scrobbled", hostScrobbled);
        stream.on("stoppedPlaying", hostStoppedPlaying);
        stream.on("error", bubbleError);
    }

    function hostIsPlaying(track) {
        setCurrentTrack(track);
        getTrackDuration(track, function(duration) {
            track.duration = duration;
            copyNowPlayingToAllGuests(that.nowPlaying);
        });
        that.emit("trackUpdated", track);
    }

    function copyNowPlayingToAllGuests(track) {
        _(that.guests).each(function(guest) {
            copyNowPlayingToGuest(guest, track);
        });
    }

    function copyNowPlayingToGuest(guest, track) {
        if (!track) {
            return;
        }
        updateGuest("nowplaying", guest, {
            track: track,
            duration: track.duration ? millisecondsToSeconds(track.duration) : null
        });
    }

    function setCurrentTrack(track) {
        that.nowPlaying = track;
    }

    function getTrackDuration(track, callback) {
        lastfm.info("track", {
            track: track,
            handlers: {
                success: function(trackInfo) {
                    callback(trackInfo.duration);
                },
                error: function() {
                    callback();
                }
            }
        });
    }

    function hostScrobbled(track) {
        addRecentPlay(track);
        copyScrobbleToAllGuests(track);
    }

    function copyScrobbleToAllGuests(track) {
        _(that.guests).each(function(guest) {
            updateGuest("scrobble", guest, {
                track: track,
                timestamp: track.date.uts
            });
        });
    }

    function addRecentPlay(track) {
        if (that.recentPlays.length >= 5) {
            that.recentPlays.splice(4);
        }
        that.recentPlays.unshift(track);
        that.emit("recentPlaysUpdated", that.recentPlays);
    }

    function hostStoppedPlaying(track) {
        that.nowPlaying = null;
        that.emit("trackUpdated");
    }

    function bubbleError(error) {
        that.emit("error", error);
    }

    function addGuest(guest) {
        var alreadyAtParty = isGuestTheHost(guest) || hasGuest(guest);
        if (alreadyAtParty) {
            return;
        }

        copyNowPlayingToGuest(guest, that.nowPlaying);

        that.guests.push(guest);
        that.emit("guestsUpdated", that.guests);
    }

    function isGuestTheHost(guest) {
        return that.host == guest.session.user;
    }

    function hasGuest(guest) {
        return _(that.guests).any(function(g) {
            return g.isSameAs(guest);
        });
    }

    function removeGuest(guest) {
        that.guests = _(that.guests).reject(function(g) {
            return g.session.key == guest.session.key;
        });
        that.emit("guestsUpdated", that.guests);

        if (!hasGuests()) {
            endParty();
        }
    }

    function hasGuests() {
        return that.guests.length > 0;
    }

    function endParty() {
        removeAllGuests();
        stopMonitoringHost();
        that.emit("finished", that);
    }

    function removeAllGuests() {
        while (that.guests.length) {
            that.guests.pop();
        }
    }

    function stopMonitoringHost() {
        stream.removeAllListeners("scrobbled");
        stream.removeAllListeners("nowPlaying");
        stream.removeAllListeners("stoppedPlaying");
        stream.stop();
    }

    function updateGuest(method, guest, options) {
        options.handlers = options.handlers || {};
        options.handlers.error = function(error) {
            var message = "Error updating " + method + " for " + guest.session.user;
            if (error && error.message) {
                message += ". Reason: " + error.message;
            }
            that.emit("error", new Error(message));
        };
        lastfm.update(method, guest.session, options);
    }

    function millisecondsToSeconds(ms) {
        return Math.round(ms / 1000);
    }
};

Party.prototype = Object.create(EventEmitter.prototype);

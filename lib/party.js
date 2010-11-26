var EventEmitter = require("events").EventEmitter;

var Party = exports.Party = function(lastfm, stream) {
    EventEmitter.call(this);

    this.host = stream.user;
    this.guests = [];
    this.nowPlaying = null;
    this.nowPlayingInfo = null;
    var nowPlayingStartTime = Math.round((new Date()).getTime() / 1000);
    this.stream = stream;
    this.lastfm = lastfm;
    var that = this;

    stream.addListener("nowPlaying", function(track) {
        that.nowPlaying = track;
        that.nowPlayingInfo = null
        nowPlayingStartTime = Math.round((new Date()).getTime() / 1000);

        that.lastfm.info("track", {
            track: track,
            success: function(trackInfo) {
                that.nowPlayingInfo = trackInfo;
                that._updateGuests("nowplaying", {
                    track: track,
                    duration: trackInfo.duration / 1000
                });
            },
            error: function(error) {
                that._updateGuests("nowplaying", {
                    track: track
                });
            }
        });

        that.emit("trackUpdated", track);
    });

    stream.addListener("scrobbled", function(track) {
        that._updateGuests("scrobble", { 
            track: track,
            timestamp: nowPlayingStartTime
        });
    });

    stream.addListener("stoppedPlaying", function(track) {
        that.nowPlaying = null;
        that.emit("trackUpdated");
    });
};

Party.prototype = Object.create(EventEmitter.prototype);

Party.prototype.addGuest = function(guest) {
    var that = this;
    if (this.host == guest.session.user || this.hasGuest(guest)) {
        return;
    }

    if (!this.stream.isStreaming) {
        this.stream.start();
    }

    this.guests.push(guest);

    if (this.nowPlaying) {
        this._updateGuest("nowplaying", guest, {
            track: this.nowPlaying,
            duration: that.nowPlayingInfo ? that.nowPlayingInfo.duration / 1000 : null
        });
    }

    this.emit("guestsUpdated", this.guests);
};

Party.prototype.hasGuest = function(guest) {
    for (var x in this.guests) {
        if (this.guests[x].session.user === guest.session.user || (this.guests[x].session.key === guest.session.key && guest.session.key)) {
            return true;
        }
    }
    return false
};

Party.prototype.removeGuest = function(guest) {
    for (var x in this.guests) {
        if (this.guests[x].session.key == guest.session.key) { 
            this.guests.splice(x, 1);
        }
    }

    this.emit("guestsUpdated", this.guests);

    if (this.guests.length == 0) {
        this.finish();
    }
};

Party.prototype.finish = function() {
    while (this.guests.length)
        this.guests.pop();

    this.stream.removeAllListeners("scrobbled");
    this.stream.removeAllListeners("nowPlaying");
    this.stream.removeAllListeners("stoppedPlaying");

    this.stream.stop();

    this.emit("finished", this);
}

Party.prototype._updateGuests = function(method, options) {
    var that = this;
    this.guests.forEach(function(guest) { that._updateGuest(method, guest, options); });
}

Party.prototype._updateGuest = function(method, guest, options) {
    var that = this;
    if (!options.error) {
        options.error = function(error) {
            that.emit("error", new Error("Error updating " + method + " for " + guest.session.user));
        };
    }
    this.lastfm.update(method, guest.session, options);
}

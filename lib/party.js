var EventEmitter = require("events").EventEmitter;

var Party = exports.Party = function(lastfm, stream) {
    EventEmitter.call(this);

    this.host = stream.user;
    this.guests = [];
    this.nowPlaying = null;
    var nowPlayingStartTime = Math.round((new Date()).getTime() / 1000);
    this.stream = stream;
    this.lastfm = lastfm;
    var that = this;

    stream.addListener("nowPlaying", function(track) {
        that.nowPlaying = track;
        nowPlayingStartTime = Math.round((new Date()).getTime() / 1000);

        that.lastfm.info("track", {
            track: track,
            success: function(trackInfo) {
                for(var guest in that.guests) {
                    that.lastfm.update("nowplaying", that.guests[guest].session, {
                        track: that.nowPlaying,
                        duration: trackInfo.duration
                    });
                }
            }
        });
    });

    stream.addListener("scrobbled", function(track) {
        for(var guest in that.guests) {
            that.lastfm.update("scrobble", that.guests[guest].session, { 
                track: track,
                timestamp: nowPlayingStartTime
            });
        }
    });

    stream.addListener("stoppedPlaying", function(track) {
        that.nowPlaying = null;
    });
};

Party.prototype = Object.create(EventEmitter.prototype);

Party.prototype.addGuest = function(guest) {
    if (this.host == guest.session.user || this.hasGuest(guest)) {
        return;
    }

    if (!this.stream.isStreaming) {
        this.stream.start();
    }

    this.guests.push(guest);

    if (this.nowPlaying) {
        this.lastfm.update("nowplaying", guest.session, { track: this.nowPlaying });
    }
};

Party.prototype.hasGuest = function(guest) {
    for (var x in this.guests) {
        if (this.guests[x].session.user === guest.session.user || this.guests[x].session.key === guest.session.key) {
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

    if (this.guests.length == 0) {
        this.stream.stop();
        this.emit("finished", this);
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

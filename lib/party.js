var Party = exports.Party = function(stream) {
    this.host = stream.user;
    this.guests = [];
    this.nowPlaying = null;
    var nowPlayingStartTime = Math.round((new Date()).getTime() / 1000);
    this.stream = stream;
    var that = this;

    stream.addListener('nowPlaying', function(track) {
        that.nowPlaying = track;
        nowPlayingStartTime = Math.round((new Date()).getTime() / 1000);

        for(guest in that.guests) {
            that.guests[guest].update('nowplaying', that.nowPlaying);
        }
    });

    stream.addListener('scrobbled', function(track) {
        for(guest in that.guests) {
            that.guests[guest].update('scrobble', track, { timestamp: nowPlayingStartTime });
        }
    });

    stream.addListener('stoppedPlaying', function(track) {
        that.nowPlaying = null;
    });
};

Party.prototype.addGuest = function(guest) {
    if (this.host == guest.user || this.hasGuest(guest)) {
        return;
    }

    this.guests.push(guest);

    if (this.nowPlaying) {
        guest.update('nowplaying', this.nowPlaying);
    }
};

Party.prototype.hasGuest = function(guest) {
    for (var x in this.guests) {
        if (this.guests[x].user === guest.user || this.guests[x].key === guest.key) {
            return true;
        }
    }
    return false
};

Party.prototype.removeGuest = function(guest) {
    function guestIndex(test) {
        for (var x in this.guests) {
            if (test(this.guests[x])) return x;
        }
    }
    this.guests.splice(guestIndex(function(g) { g.key == guest.key; }));
};

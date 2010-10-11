var Party = exports.Party = function(host, stream) {
    this.guests = [];
    this.nowPlaying = null;
    var stream = stream;
    var that = this;

    stream.addListener('nowPlaying', function(track) {
        that.nowPlaying = track;
        for(guest in that.guests) {
            that.guests[guest].updateNowPlaying(that.nowPlaying);
        }
    });

    stream.addListener('scrobbled', function(track) {
        for(guest in that.guests) {
            that.guests[guest].scrobble(track);
        }
    });

    stream.addListener('stoppedPlaying', function(track) {
        that.nowPlaying = null;
        for(guest in that.guests) {
            that.guests[guest].updateNowPlaying(null);
        }
    });
};

Party.prototype.addGuest = function(guest) {
    this.guests.push(guest);
    if (this.nowPlaying) {
        guest.updateNowPlaying(this.nowPlaying);
    }
};

var Party = exports.Party = function(host, stream) {
    this.host = host;
    this.guests = [];
    this.nowPlaying = null;
    this.nowPlayingStartTime = 0;
    var stream = stream;
    var that = this;

    stream.addListener('nowPlaying', function(track) {
        that.nowPlaying = track;
        that.nowPlayingStartTime = Math.round((new Date()).getTime() / 1000);

        console.log('nowPlaying: ' + track.name + ' at: ' + that.nowPlayingStartTime);
        for(guest in that.guests) {
            console.log('updating ' + that.guests[guest].user);
            that.guests[guest].update('nowplaying', that.nowPlaying);
        }
    });

    stream.addListener('scrobbled', function(track) {
        console.log('scrobbled: ' + track.name);
        for(guest in that.guests) {
            console.log('scrobbling ' + that.guests[guest].user);
            that.guests[guest].update('scrobble', track, { timestamp: that.nowPlayingStartTime });
        }
    });

    stream.addListener('stoppedPlaying', function(track) {
        that.nowPlaying = null;
    });
};

Party.prototype.addGuest = function(guest) {
    if (this.host == guest.user) {
        return;
    }

    this.guests.push(guest);
    if (this.nowPlaying) {
        guest.update('nowplaying', this.nowPlaying);
    }
};

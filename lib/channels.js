var _ = require("underscore");
var Channel = require("./channel").Channel;

var Channels = exports.Channels = function(boxsocial) {
    var that = this;
    this.boxsocial = boxsocial;
    this._channels = [];

    this.boxsocial.on("guestsUpdated", function(party, guestlist) {
        var channel = that._findChannelByName(party.host);
        if (channel) {
            channel.publish({ guestlist: guestlist });
        }
    });

    this.boxsocial.on("trackUpdated", function(party, track) {
        var channel = that._findChannelByName(party.host);
        if (channel) {
            channel.publish({ nowPlaying: { track: track } });
        }
    });

    this.boxsocial.on("recentPlaysUpdated", function(party, recentPlays) {
        var channel = that._findChannelByName(party.host);
        if (channel) {
            channel.publish({ recentPlays: recentPlays });
        }
    });

    this.boxsocial.on("partyFinished", function(party) {
        var channel = that._findChannelByName(party.host);
        if (channel) {
            channel.publish({ partyOver: true });
        }
    });
}

Channels.prototype.count = function() {
    return this._channels.length;
}

Channels.prototype.subscribe = function(host, client) {
    var channel = this._findChannelByName(host);

    if (!channel) {
        channel = new Channel(host);
        this._channels.push(channel);
    }

    channel.addClient(client);

    return channel;
};

Channels.prototype._findChannelByName = function(name) {
    var channel = _.detect(this._channels, function(c) {
        return c.name.toLowerCase() == name.toLowerCase();
    });
    return channel;
};

var _ = require("underscore");
var Channel = require("./channel").Channel;

var Channels = exports.Channels = function(boxsocial) {
    var channels = [];

    boxsocial.on("guestsUpdated", function(party, guestlist) {
        var channel = findChannelByName(party.host);
        if (channel) {
            channel.publish({ guestlist: guestlist });
        }
    });

    boxsocial.on("trackUpdated", function(party, track) {
        var channel = findChannelByName(party.host);
        if (channel) {
            channel.publish({ nowPlaying: { track: track } });
        }
    });

    boxsocial.on("recentPlaysUpdated", function(party, recentPlays) {
        var channel = findChannelByName(party.host);
        if (channel) {
            channel.publish({ recentPlays: recentPlays });
        }
    });

    boxsocial.on("partyFinished", function(party) {
        var channel = findChannelByName(party.host);
        if (channel) {
            channel.publish({ partyOver: true });
        }
    });

    this.count = function() {
        return channels.length;
    };

    this.subscribe = function(host, client) {
        var channel = findChannelByName(host);

        if (!channel) {
            channel = new Channel(host);
            channels.push(channel);
        }

        var party = boxsocial.findParty({ host: host});
        if (party && party.nowPlaying) {
            client.send({ nowPlaying: { track: party.nowPlaying } });
        }

        channel.addClient(client);

        return channel;
    };

    function findChannelByName(name) {
        var channel = _(channels).detect(function(c) {
            return c.name.toLowerCase() == name.toLowerCase();
        });
        return channel;
    }
}

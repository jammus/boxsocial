var _ = require("underscore");
var Channel = require("./channel").Channel;

var Channels = exports.Channels = function(boxsocial) {
    var channels = [];

    this.count = function() {
        return channels.length;
    };

    this.subscribe = function(host, client) {
        var channel = findChannelByName(host);

        if (!channel) {
            var party = boxsocial.findParty({ host: host});
            channel = new Channel(party);
            channels.push(channel);
            channel.on("empty", function() {
                channels = _(channels).reject(function(c) {
                    return c == channel;
                });
                channel = null;
            });
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

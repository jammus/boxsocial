var _ = require("underscore");
var Channel = require("./channel").Channel;

var Channels = exports.Channels = function(boxsocial) {
    var channels = [];

    this.count = function() {
        return channels.length;
    };

    this.subscribe = function(host, client) {
        return subscribe(host, client);
    };

    function subscribe(host, client) {
        var channel = findChannelByName(host) || createChannel(host);
        if (!channel) {
            return;
        }
        channel.addClient(client);
        return channel;
    }

    function findChannelByName(name) {
        var channel = _(channels).detect(function(c) {
            return c.name.toLowerCase() == name.toLowerCase();
        });
        return channel;
    }

    function createChannel(host) {
        var party = boxsocial.findParty({ host: host});
        if (!party) {
            return;
        }

        var channel = new Channel(party);
        channels.push(channel);
        channel.on("empty", removeChannel); 
        return channel;
    }

    function removeChannel() {
        var channel = this;
        channels = _(channels).reject(function(c) {
            return c.name.toLowerCase() == channel.name.toLowerCase();
        });
    }
}

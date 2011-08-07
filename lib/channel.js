var _ = require("underscore"),
    EventEmitter = require("events").EventEmitter;


var Channel = exports.Channel = function(party) {
    EventEmitter.call(this);

    startMonitoringParty();

    var that = this,
        clients = [];

    this.name = party.host;

    this.addClient = function(client) {
        addClient(client);
    };

    this.removeClient = function(client) {
        removeClient(client);
    };

    function startMonitoringParty() {
        party.on("guestsUpdated", function(guestlist) {
            publish({ guestlist: guestlist });
        });

        party.on("trackUpdated", function(track) {
            publish({ nowPlaying: { track: track } });
        });

        party.on("recentPlaysUpdated", function(recentPlays) {
            publish({ recentPlays: recentPlays });
        });

        party.on("finished", function(party) {
            publish({ partyOver: true });
        });
    }

    function addClient(client) {
        if (party && party.nowPlaying) {
            client.send({ nowPlaying: { track: party.nowPlaying } });
        }

        clients.push(client);
        client.on("disconnect", function() {
            removeClient(client);
        });
    }

    function removeClient(client) {
        clients = _(clients).reject(function(c) {
            return c == client;
        });
        if (clients.length == 0) {
            that.emit("empty");
        }
    }

    function publish(message) {
        clients.forEach(function(client) {
            client.send(message);
        });
    }
};

Channel.prototype = Object.create(EventEmitter.prototype);

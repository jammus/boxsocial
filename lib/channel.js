var _ = require("underscore"),
    EventEmitter = require("events").EventEmitter;


var Channel = exports.Channel = function(party) {
    EventEmitter.call(this);
    this.party = party;
    this.name = party.host;
    this.clients = [];
    var that = this;

    party.on("guestsUpdated", function(guestlist) {
        that.publish({ guestlist: guestlist });
    });

    party.on("trackUpdated", function(track) {
        that.publish({ nowPlaying: { track: track } });
    });

    party.on("recentPlaysUpdated", function(recentPlays) {
        that.publish({ recentPlays: recentPlays });
    });

    party.on("finished", function(party) {
        that.publish({ partyOver: true });
    });
};

Channel.prototype = Object.create(EventEmitter.prototype);

Channel.prototype.addClient = function(client) {
    var that = this;
    if (this.party && this.party.nowPlaying) {
        client.send({ nowPlaying: { track: this.party.nowPlaying } });
    }

    this.clients.push(client);
    client.on("disconnect", function() {
        that.removeClient(client);
    });
};

Channel.prototype.removeClient = function(client) {
    this.clients = _(this.clients).reject(function(c) {
        return c == client;
    });
    if (this.clients.length == 0) {
        this.emit("empty");
    }
};

Channel.prototype.publish = function(message) {
    this.clients.forEach(function(client) {
        client.send(message);
    });
};

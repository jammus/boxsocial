var Channel = exports.Channel = function(party) {
    this.party = party;
    this.name = party.host;
    this.clients = [];
};

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
    var index = this.clients.indexOf(client);
    this.clients.splice(index, 1);
};

Channel.prototype.publish = function(message) {
    this.clients.forEach(function(client) {
        client.send(message);
    });
};

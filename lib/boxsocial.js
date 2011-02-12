var EventEmitter = require("events").EventEmitter;
var Party = require("../lib/party").Party;
var PartyMonitor = require("../lib/partymonitor").PartyMonitor;
var _ = require("underscore");

var BoxSocial = function(lastfm, partyTimeout) {
    EventEmitter.call(this);

    this.lastfm = lastfm;
    this.parties = [];
    this.partyTimeout = partyTimeout;
};

BoxSocial.prototype = Object.create(EventEmitter.prototype);

BoxSocial.prototype.attend = function (host, guest) {
    var that = this;

    function cleanUpParty(party) {
        that.emit("partyFinished", party);
        that.parties = _.reject(that.parties, function(p) {
            return p.host == party.host;
        });
    }

    function createParty(host) {
        var stream = that.lastfm.stream(host);
        var party = new Party(that.lastfm, stream);
        var monitor = new PartyMonitor(party, that.partyTimeout);
        
        party.on("finished", cleanUpParty);

        party.on("trackUpdated", function(track) {
            that.emit("trackUpdated", party, track);
        });

        party.on("recentPlaysUpdated", function(tracks) {
            that.emit("recentPlaysUpdated", party, tracks);
        });

        party.on("guestsUpdated", function(guests) {
            that.emit("guestsUpdated", party, guests);
        });

        party.on("error", function(error) {
            that.emit("error", error);
        });

        that.parties.push(party);

        return party;
    }

    var joiningOwnParty = (host.toLowerCase() == guest.session.user.toLowerCase());
    if (joiningOwnParty) return;

    var party = this.findParty({ host: guest.session.user });
    if (party) {
        return party;
    }

    party = this.findParty({ guest: { session: { user: host, key: "" } } });
    if (!party) {
        party = this.findParty({host: host});
    }

    if (!party) {
        party = createParty(host);
    }

    this.leave(guest);
    party.addGuest(guest);

    return party;
};

BoxSocial.prototype.partyCount = function() {
    return this.parties.length;
};

BoxSocial.prototype.findParty = function(options) {
    var that = this;

    if (options.host) {
        return _.detect(that.parties, function(p) {
            return p.host.toLowerCase() == options.host.toLowerCase();
        });
    }
    if (options.guest) {
        return _.detect(that.parties, function(p) {
            return p.hasGuest(options.guest);
        });
    }
    return null;
};

BoxSocial.prototype.leave = function(guest) {
    var party = this.findParty({guest: guest});
    if (party) {
        party.removeGuest(guest);
    }
};

exports.BoxSocial = BoxSocial;

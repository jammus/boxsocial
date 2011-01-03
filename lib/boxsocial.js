var EventEmitter = require("events").EventEmitter;
var Party = require('../lib/party').Party;

var BoxSocial = function(lastfm) {
    EventEmitter.call(this);

    this.lastfm = lastfm;
    this.parties = [];
};

BoxSocial.prototype = Object.create(EventEmitter.prototype);

BoxSocial.prototype.attend = function (host, guest) {
    var that = this;

    function cleanUpParty(party) {
        for (var x in that.parties) {
            if (that.parties[x].host == party.host) { 
                that.parties.splice(x, 1);
            }
        }
    }

    function createParty(host) {
        var stream = that.lastfm.stream(host);
        var party = new Party(that.lastfm, stream);
        
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

    var joiningOwnParty = (host == guest.session.user);
    if (joiningOwnParty) return;

    var guestIsAHost = this.findParty({ host: guest.session.user });
    if (guestIsAHost) return guestIsAHost;

    var party = this.findParty({ guest: { session: { user: host, key: "" } } });

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
    function whereParty(test) {
        for(x in that.parties) {
            if (test(that.parties[x])) {
                return that.parties[x];
            }
        }
    }

    if (options.host) {
        return whereParty(function(p) { return p.host.toLowerCase() == options.host.toLowerCase(); });
    }
    if (options.guest) {
        return whereParty(function(p) { return p.hasGuest(options.guest); });
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

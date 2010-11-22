var Party = require('../lib/party').Party;

var BoxSocial = function(lastfm) {
    this.lastfm = lastfm;
    this.parties = [];
};

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
        that.parties.push(party);
        return party;
    }

    var joiningOwnParty = (host == guest.user);
    if (joiningOwnParty) return;

    var guestIsAHost = this.findParty({ host: guest.user });
    if (guestIsAHost) return;

    var party = this.findParty({ guest: { user: host } });

    if (!party) {
        party = this.findParty({host: host});
    }

    if (!party) {
        party = createParty(host);
    }

    this.leave(guest);

    party.addGuest(guest);
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
        return whereParty(function(p) { return p.host == options.host; });
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

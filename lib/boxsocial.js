var Party = require('../lib/party').Party;

var BoxSocial = function(lastfm) {
    this.lastfm = lastfm;
    this.parties = [];
};

BoxSocial.prototype.attend = function (host, guest) {
    var party = this.findParty({host: host});
    if (!party) {
        var stream = this.lastfm.stream(host);
        party = new Party(stream);
        stream.start();
        this.parties.push(party);
    }
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


// boxsocial.leave(sk);

// var parties = boxsocial.parties;

// ******

// boxsocial.attend(host, guest);

// boxsocial.leave(guest);

// boxsocial.partyCount();

// boxsocial.isPartying(user);

// boxsocial.isHosting(user);

// boxsocial.findHost(username);

// boxsocial.findGuest(username);

// party.guests();

// party.nowPlaying();

// party(host);

// party.addGuest(guest);

// party.removeGuest(guest);
//

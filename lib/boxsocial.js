var EventEmitter = require("events").EventEmitter,
    Party = require("../lib/party").Party,
    PartyMonitor = require("../lib/partymonitor").PartyMonitor,
    _ = require("underscore");

var BoxSocial = exports.BoxSocial = function(lastfm, partyTimeout) {
    EventEmitter.call(this);

    this.lastfm = lastfm;
    this.parties = [];
    this.partyTimeout = partyTimeout;
};

BoxSocial.prototype = Object.create(EventEmitter.prototype);

BoxSocial.prototype.attend = function (host, guest) {
    var that = this;
    var party;

    if (isJoiningOwnParty(host, guest)) {
        party = this.findParty({ host: host });
        return party;
    }

    party = findPartyByUser(guest);
    if (party && party.host == guest.session.user) {
        return party;
    }

    party = findPartyByUser(host);
    if (!party) {
        party = createParty(host);
    }

    this.leave(guest);
    party.addGuest(guest);

    return party;

    function isJoiningOwnParty(host, guest) {
        return host.toLowerCase() == guest.session.user.toLowerCase();
    }

    function removeParty(party) {
        that.emit("partyFinished", party);
        that.parties = _.reject(that.parties, function(p) {
            return p.host == party.host;
        });
    }

    function createParty(host) {
        var stream = that.lastfm.stream(host);
        var party = new Party(that.lastfm, stream);
        var monitor = new PartyMonitor(party, that.partyTimeout);
        
        party.on("finished", removeParty);

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

    function findPartyByUser(user) {
        var type = typeof(user);
        var username = (type == "string") ? username = user : user.session.user;

        var party = that.findParty({ host: username });
        if (!party) {
            party = that.findParty({ guest: {
                session: {
                    user: username,
                    key: ""
                }
            }});
        }
        return party;
    }
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

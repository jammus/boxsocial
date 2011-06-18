var EventEmitter = require("events").EventEmitter,
    Party = require("../lib/party").Party,
    PartyMonitor = require("../lib/partymonitor").PartyMonitor,
    _ = require("underscore");

var BoxSocial = exports.BoxSocial = function(lastfm, partyTimeout) {
    EventEmitter.call(this);

    var that = this,
        parties = [];

    this.getTopParties = function(maxParties) {
        return _(parties).first(maxParties);
    };

    this.partyCount = function() {
        return parties.length;
    };

    this.attend = function(host, guest) {
        return attend(host, guest);
    };

    this.findParty = function(options) {
        return findParty(options);
    };

    this.leaveParty = function(guest) {
        leaveParty(guest);
    };

    function attend(host, guest) {
        if (isJoiningOwnParty(host, guest)) {
            return findPartyByUser(host)
        }

        if (isHostingAParty(guest)) {
            return findPartyByUser(guest)
        }

        var party = findPartyByUser(host) || createParty(host);
        if (!party.hasGuest(guest)) {
            leaveParty(guest);
            party.addGuest(guest);
        }

        return party;
    }

    function isJoiningOwnParty(host, guest) {
        return host.toLowerCase() == guest.session.user.toLowerCase();
    }

    function isHostingAParty(guest) {
        var party = findPartyByUser(guest);
        return party && party.host == guest.session.user;
    }

    function findParty(options) {
        if (options.host) {
            return _(parties).detect(function(p) {
                return p.host.toLowerCase() == options.host.toLowerCase();
            });
        }
        if (options.guest) {
            return _(parties).detect(function(p) {
                return p.hasGuest(options.guest);
            });
        }
        return null;
    }

    function leaveParty(guest) {
        var party = findParty({guest: guest});
        if (party) {
            party.removeGuest(guest);
        }
    }
    
    function removeParty(party) {
        parties = _(parties).reject(function(p) {
            return p.host == party.host;
        });
        that.emit("partyFinished", party);
    }

    function createParty(host) {
        var party = new Party(lastfm, host);
        var monitor = new PartyMonitor(party, partyTimeout);
        
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

        parties.unshift(party);

        that.emit("newParty", party);

        return party;
    }

    function findPartyByUser(user) {
        var username = typeof user == "string" ? user : user.session.user;

        var party = findParty({ host: username });
        if (!party) {
            party = findParty({ guest: {
                session: {
                    user: username,
                    key: ""
                }
            }});
        }
        return party;
    }
};

BoxSocial.prototype = Object.create(EventEmitter.prototype);

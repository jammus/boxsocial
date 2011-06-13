var EventEmitter = require("events").EventEmitter,
    Party = require("../lib/party").Party,
    PartyMonitor = require("../lib/partymonitor").PartyMonitor,
    _ = require("underscore");

var BoxSocial = exports.BoxSocial = function(lastfm, partyTimeout) {
    var that = this;

    EventEmitter.call(this);

    var parties = [];

    this.getTopParties = function(maxParties) {
        return _(parties).first(maxParties);
    };

    this.partyCount = function() {
        return parties.length;
    };

    this.attend = function(host, guest) {
        var party;

        if (isJoiningOwnParty(host, guest)) {
            party = findPartyByUser(host)
            return party;
        }

        if (isGuestHostingAParty(guest)) {
            party = findPartyByUser(guest)
            return party;
        }

        party = findPartyByUser(host);
        if (!party) {
            party = createParty(host);
        }

        if (!party.hasGuest(guest)) {
            this.leaveParty(guest);
            party.addGuest(guest);
        }

        return party;

        function isJoiningOwnParty(host, guest) {
            return host.toLowerCase() == guest.session.user.toLowerCase();
        }

        function isGuestHostingAParty(guest) {
            var party = findPartyByUser(guest);
            return party && party.host == guest.session.user;
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

    this.findParty = function(options) {
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
    };

    this.leaveParty = function(guest) {
        var party = this.findParty({guest: guest});
        if (party) {
            party.removeGuest(guest);
        }
    };
};

BoxSocial.prototype = Object.create(EventEmitter.prototype);

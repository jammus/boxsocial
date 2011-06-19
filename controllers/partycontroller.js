var cutils = require("./cutils");
var Guest = require("../lib/guest").Guest;

module.exports = function(lastfm, boxsocial, config) {
    return {
        index: {
            get: function(req, res) {
                var parties = boxsocial.getTopParties(100);
                res.render("parties", { 
                    guest: req.session.guest,
                    parties: parties
                });
            }
        },

        view: {
            get: function(req, res) {
                var host = req.params.host;
                var party = boxsocial.findParty({host: host});    
                if (party) {
                    res.render("party", { 
                        title: cutils.title(host + "'s party", config.shortTitle),
                        guest: req.session.guest,
                        party: party,
                        host: host,
                        guests: party.guests,
                        recentPlays: party.recentPlays
                    });
                    return;
                }
                res.render("noparty", {
                    title: cutils.title(host + "'s party", config.shortTitle),
                    guest: req.session.guest, host: host
                });
            }
        },

        chose: {
            get: function(req, res) {
                cutils.checkLoggedIn(req, res, "/join", function() {
                    res.render("join", {
                        title: cutils.title("Join a Party", config.shortTitle),
                        guest: req.session.guest
                    });        
                });
            },
            post: function(req, res) {
                var host = req.param("host");
                cutils.checkLoggedIn(req, res, "/join/" + host, function() {
                    res.redirect("/join/" + host);
                });
            }
        },

        join: {
            get: function(req, res) {
                var host = req.params.host;
                cutils.checkLoggedIn(req, res, "/join/" + host, function() {
                    res.render("join_confirm", {
                        title: cutils.title("Join a Party", config.shortTitle),
                        host: host,
                        guest: req.session.guest
                    });
                });
            },

            post: function(req, res) {
                var host = req.params.host;
                cutils.checkLoggedIn(req, res, "/join/" + host, function() {
                    var fmsession = lastfm.session(req.session.user, req.session.key);
                    var guest = new Guest(lastfm, fmsession);
                    req.session.guest = guest;
                    var party = boxsocial.attend(host, guest);
                    if (party) {
                        host = party.host;
                    }
                    res.redirect("/party/" + host);
                });
            }
        },

        leave: {
            get: function(req, res) {
                var guest = req.session.guest;
                if (guest) {
                    boxsocial.leaveParty(guest);
                }
                res.redirect("/");
            }
        }
    }
};

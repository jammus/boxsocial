var cutils = require("./cutils");

module.exports = function(lastfm, boxsocial, config) {
    return {
        index: {
            get: function(req, res) {
                var parties = boxsocial.parties;
                res.render("parties", { 
                    locals: {
                        guest: req.session.guest,
                        parties: parties
                    }
                });
            }
        },

        view: {
            get: function(req, res) {
                var host = req.params.host;
                var party = boxsocial.findParty({host: host});    
                if (party) {
                    res.render("party", { 
                        locals: {
                            title: cutils.title(host + "'s party", config.shortTitle),
                            guest: req.session.guest,
                            party: party, host: host,
                            guests: party.guests,
                            recentPlays: party.recentPlays
                        }
                    });
                    return;
                }
                res.render("noparty", {
                    locals: {
                        title: cutils.title(host + "'s party", config.shortTitle),
                        guest: req.session.guest, host: host
                    }
                });
            }
        },

        chose: {
            get: function(req, res) {
                cutils.checkLoggedIn(req, res, "/join");
                res.render("join", {
                    locals: {
                        title: cutils.title("Join a Party", config.shortTitle),
                        guest: req.session.guest
                    }
                });        
            },
            post: function(req, res) {
                var host = req.param("host");
                cutils.checkLoggedIn(req, res, "/join/" + host);
                res.redirect("/join/" + host);
            }
        },

        join: {
            get: function(req, res) {
                var host = req.params.host;
                cutils.checkLoggedIn(req, res, "/join/" + host);
                res.render("join_confirm", {
                    locals: {
                        title: cutils.title("Join a Party", config.shortTitle),
                        host: host,
                        guest: req.session.guest
                    }
                });
            },

            post: function(req, res) {
                var host = req.params.host;
                cutils.checkLoggedIn(req, res, "/join/" + host);
                var guest = req.session.guest;
                var party = boxsocial.attend(host, guest);
                if (party) {
                    host = party.host;
                }
                res.redirect("/party/" + host);
            }
        },

        leave: {
            get: function(req, res) {
                var guest = req.session.guest;
                if (guest) {
                    boxsocial.leave(guest);
                }
                res.redirect("/");
            }
        }
    }
};

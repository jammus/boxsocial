var querystring = require("querystring"),
    Guest = require("../lib/guest").Guest,
    _ = require("underscore");

module.exports = function(lastfm, boxsocial, config) {
    var bannedUsers = config.bannedUsers || [ ];
    return {
        index: {
            get: function(req, res) {
                var callbackUrl = "http://" + config.host + (config.port != "80" ? ":" + config.port : "") + "/callback";

                var params = { 
                    api_key: lastfm.api_key,
                    cb: callbackUrl
                };

                var lastfmLogin = "http://last.fm/api/auth?" + querystring.stringify(params);
                res.redirect(lastfmLogin);
            }
        },

        callback: {
            get: function(req, res) {
                var fmsession = lastfm.session({
                    token: req.param("token"),
                    handlers: {
                        success: function(session) {
                            if (_(bannedUsers).contains(session.user.toLowerCase())) {
                                res.redirect('/banned');
                                return;
                            }
                            var guest = new Guest(lastfm, fmsession);
                            req.session.guest = guest;
                            req.session.user = session.user;
                            req.session.key = session.key;
                            var redirectUrl = req.session.redirectUrl ? req.session.redirectUrl : "/";
                            req.session.redirectUrl = null;
                            res.redirect(redirectUrl);
                        },
                        error: function(error) {
                            res.send("Error authorising - " + error.message);
                        }
                    }
                });
            }
        },

        logout: {
            post: function(req, res) {
                boxsocial.leaveParty(req.session.guest);
                req.session.destroy();
                res.redirect("/");
            }
        }
    }
};

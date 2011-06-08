var querystring = require("querystring");
var Guest = require("../lib/guest").Guest;

module.exports = function(lastfm, boxsocial, config) {
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
                var token = req.param("token");
                var fmsession = lastfm.session();
                fmsession.authorise(token, {
                    handlers: {
                        authorised: function(session) {
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
                boxsocial.leave(req.session.guest);
                req.session.destroy();
                res.redirect("/");
            }
        }
    }
};

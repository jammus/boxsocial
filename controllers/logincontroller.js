var querystring = require("querystring");
var Guest = require("../lib/guest").Guest;

module.exports = function(lastfm, boxsocial, config) {
    return {
        index: {
            get: function(req, res) {
                var callbackUrl = "http://" + config.host + (config.port != "80" ? ":" + config.port : "") + "/callback";

                var params = { 
                    api_key: lastfm.params.api_key,
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

                fmsession.on("error", function(error) {
                    res.send("Error authorising - " + error.message);
                });

                fmsession.on("authorised", function(session) {
                    var guest = new Guest(lastfm, session);
                    req.session.guest = guest;
                    var redirectUrl = req.session.redirectUrl ? req.session.redirectUrl : "/";
                    req.session.redirectUrl = null;
                    res.redirect(redirectUrl);
                });

                fmsession.authorise(token);
            }
        }
    }
};

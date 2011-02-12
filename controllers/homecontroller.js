var _ = require("underscore");
var cutils = require("./cutils");

module.exports = function(lastfm, boxsocial, config) {
    function properCase(text) {
        return text.replace(/\w\S*/g, function(txt){
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }

    return {
        index: {
            get: function(req, res) {
                var guest = req.session.guest;
                var party = null;
                if (guest) {
                   party = boxsocial.findParty({guest: guest});
                }

                res.render("index", {
                    locals: {
                        guest: req.session.guest,
                        currentParty: party,
                        parties: _(boxsocial.parties).first(5),
                        title: config.longTitle
                    }
                });
            }
        },

        content: {
            get: function(req, res) {
                res.render(req.params.page, {
                    locals: {
                        guest: req.session.guest,
                        title: cutils.title(properCase(req.params.page), config.shortTitle)
                    }
                });
            }
        }
    }
};

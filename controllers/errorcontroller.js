var cutils = require("./cutils");

module.exports = function(lastfm, boxsocial, config) {
    return {
        error: function(err, req, res) {
            if (err.message.indexOf("ENOENT") > -1)
                res.render("404", {
                    status: 404,
                    locals: {
                        title: cutils.title("Page not found", config.shortTitle),
                        guest: req.session.guest
                    }
                });
            else
                res.render("500", {
                    status: 500,
                    locals: {
                        title: cutils.title("Error", config.shortTitle),
                        guest: req.session.guest
                    }
                });
        }
    }
};


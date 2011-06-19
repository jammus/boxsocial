var cutils = require("./cutils");

module.exports = function(lastfm, boxsocial, config) {
    return {
        error: function(err, req, res) {
            if (err.message.indexOf("ENOENT") > -1) {
                display404(req, res);
            }
            else {
                display500(req, res);
            }
        }
    };

    function display404(req, res) {
        displayError(req, res, 404, "Page not found");
    }

    function display500(req, res) {
        displayError(req, res, 500, "Error");
    }

    function displayError(req, res, code, title) {
        res.render(code, {
            status: code,
            title: cutils.title(title, config.shortTitle),
            guest: req.session ? req.session.guest : undefined
        });
    }
};


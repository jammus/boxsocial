module.exports = function() {
    return {
        error: function(err, req, res) {
            if (err.message.indexOf("ENOENT") > -1)
                res.render("404", { status: 404, locals: { guest: req.session.guest } });
            else
                res.render("500", { status: 500, locals: { guest: req.session.guest } });
        }
    }
};


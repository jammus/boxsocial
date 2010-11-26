module.exports = function() {
    return {
        error: function(err, req, res) {
            if (err.message.indexOf("ENOENT") > -1)
                res.render("404", { status: 404 });
            else
                res.render("500", { status: 500 });
        }
    }
};


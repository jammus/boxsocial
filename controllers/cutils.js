module.exports = {
    checkLoggedIn: function(req, res, redirectUrl, callback) {
        var guest = req.session.guest;
        if (!guest) {
            req.session.redirectUrl = redirectUrl;
            res.redirect("/login");
            return;
        }
        callback();
    },
    title: function(title, siteDetails) {
        return title + ": " + siteDetails;
    }
};

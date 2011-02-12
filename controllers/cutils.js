module.exports = {
    checkLoggedIn: function(req, res, redirectUrl) {
        var guest = req.session.guest;
        if (!guest) {
            req.session.redirectUrl = redirectUrl;
            res.redirect("/login");
        }
    },
    title: function(title, siteDetails) {
        return title + ": " + siteDetails;
    }
};

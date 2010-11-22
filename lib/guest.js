var Guest = exports.Guest = function(lastfm, session) {
    var that = this;

    if (!lastfm)
        throw new Error("Missing LastFmNode");

    this.session = session;

    if (session && session.isAuthorised()) {
        lastfm.info("user", {
            user: session.user,
            success: function(user) {
                that.user = user;
            }
        });
    }
};

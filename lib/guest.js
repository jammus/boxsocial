var Guest = exports.Guest = function(lastfm, session) {
    function getUserInfo(session) {
        lastfm.info("user", {
            user: session.user,
            success: function(user) {
                that.user = user;
            }
        });
    }

    var that = this;

    if (!lastfm)
        throw new Error("Missing LastFmNode");

    this.session = session;

    if (session && session.isAuthorised()) {
        getUserInfo(session);
    }
    else if (session) {
        session.on("authorised", getUserInfo);
    }
};

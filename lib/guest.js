var Guest = exports.Guest = function(lastfm, session) {
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

    function getUserInfo(authedSession) {
        lastfm.info("user", {
            user: authedSession.user,
            success: function(user) {
                that.user = user;
            }
        });
    }
};

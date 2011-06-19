var Guest = exports.Guest = function(lastfm, session) {
    var that = this;

    this.session = session;

    this.user = undefined;

    if (session && session.isAuthorised()) {
        fetchUserInfo(session);
    }
    else if (session) {
        session.on("authorised", fetchUserInfo);
    }

    this.isSameAs = function(guest) {
        return isSameAs(guest);
    }

    function fetchUserInfo(session) {
        lastfm.info("user", {
            user: session.user,
            success: function(user) {
                that.user = user;
            }
        });
    }

    function isSameAs(guest) {
        if (typeof guest == "string") {
            return guest && namesMatch(guest, session.user);
        }
        return (session.user && namesMatch(guest.session.user, session.user)) || 
            (session.key && guest.session.key === session.key);
    }

    function namesMatch(a, b) {
        return a.toLowerCase() === b.toLowerCase();
    }
};

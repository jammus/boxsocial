require("./common.js");
var Guest = require("../lib/guest.js").Guest;

(function() {
    describe("A new guest")

    var lastfm;

    before(function() {
        lastfm = new LastFmNode();
    });

    it("has no user details", function() {
        var guest = new Guest(lastfm);
        assert.ok(!guest.user);
    });

    it("can have a session specified", function() {
        var session = new LastFmSession(lastfm);
        var guest = new Guest(lastfm, session);
        assert.equal(session, guest.session);
    });
})();

(function() {
    describe("A guest created with an authorised session")

    var lastfm, session, gently;

    before(function() {
        lastfm = new LastFmNode();
        session = new LastFmSession(lastfm, "username", "key");
        gently = new Gently();
    });

    it("gets extended user info", function() {
        gently.expect(lastfm, "info", function(type, options) {
            assert.equal("user", type);
            assert.equal("username", options.user);
        });
        new Guest(lastfm, session);
    });

    it("adds extended user info to self", function() {
        gently.expect(lastfm, "info", function(type, options) {
            options.success({ name: "username", realname: "User Name" });
        });
        var guest = new Guest(lastfm, session);
        assert.ok(guest.user.name);
        assert.equal("username", guest.user.name);
        assert.equal("User Name", guest.user.realname);
    });
})();

(function() {
    describe("A guest created with an unauthorised session")

    var lastfm, session, gently;

    before(function() {
        lastfm = new LastFmNode();
        session = new LastFmSession(lastfm);
        gently = new Gently();
    });

    it("does not get extended info", function() {
        lastfm.info = function() {
            assert.ok(false);
        };
        new Guest(lastfm, session);
    });

    it("waits until authorised before getting extended user info", function() {
        gently.expect(lastfm, "info", function(type, options) {
            options.success({ name: "username", realname: "User Name" });
        });
        var guest = new Guest(lastfm, session);
        session.emit("authorised", new LastFmSession(lastfm, "username", "sessionkey"));
        assert.ok(guest.user.name);
        assert.equal("username", guest.user.name);
        assert.equal("User Name", guest.user.realname);
    });
})();

(function() {
    describe("A guest is the same as another when");

    var before = function() {
        lastfm = new LastFmNode();
        lastfm.info = function() { };
        gently = new Gently();
    };

    var lastfm, session, gently;

    before(before);

    it("has the same username", function() {
        var guestOne = new Guest(lastfm, new LastFmSession(lastfm,
                "user", "key1"));
        var guestTwo = new Guest(lastfm, new LastFmSession(lastfm,
                "user", "key2"));
        assert.ok(guestOne.isSameAs(guestTwo));
    });

    it("has the same session key", function() {
        var guestOne = new Guest(lastfm, new LastFmSession(lastfm,
                "user1", "key"));
        var guestTwo = new Guest(lastfm, new LastFmSession(lastfm,
                "user2", "key"));
        assert.ok(guestOne.isSameAs(guestTwo));
    });

    it("username matches supplied string", function() {
        var guestOne = new Guest(lastfm, new LastFmSession(lastfm,
                "user", "key1"));
        assert.ok(guestOne.isSameAs("user"));
    });

    describe("A guest is not the same as another when");

    before(before);

    it("has blank session key", function() {
        var guestOne = new Guest(lastfm, new LastFmSession(lastfm,
                "user1", ""));
        var guestTwo = new Guest(lastfm, new LastFmSession(lastfm,
                "user2", ""));
        assert.ok(!guestOne.isSameAs(guestTwo));
    });

    it("has blank username", function() {
        var guestOne = new Guest(lastfm, new LastFmSession(lastfm,
                "", "key1"));
        var guestTwo = new Guest(lastfm, new LastFmSession(lastfm,
                "", "key2"));
        assert.ok(!guestOne.isSameAs(guestTwo));
    });
})();

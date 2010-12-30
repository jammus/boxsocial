require("./common.js");
var Guest = require("../lib/guest.js").Guest;

(function() {
describe("A new guest")
    var lastfm;

    before(function() {
        lastfm = new LastFmNode();
    });

    it("requires a lastfm instance", function() {
        assert.throws(function() { new Guest(); });
        new Guest(lastfm);
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
        gently.expect(lastfm, "info", 0);
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

require("./common.js");
var Guest = require("../lib/guest.js").Guest;

describe("A new guest")
    before(function() {
        this.lastfm = new LastFmNode();
    });

    it("requires a lastfm instance", function() {
        assert.throws(function() { new Guest(); });
        new Guest(this.lastfm);
    });

    it("has no user details", function() {
        var guest = new Guest(this.lastfm);
        assert.ok(!guest.user);
    });

    it("can have a session specified", function() {
        var session = new LastFmSession(this.lastfm);
        var guest = new Guest(this.lastfm, session);
        assert.equal(session, guest.session);
    });

describe("A guest created with an authorised session")
    before(function() {
        this.lastfm = new LastFmNode();
        this.session = new LastFmSession(this.lastfm, "username", "key");
        this.gently = new Gently();
    });

    it("gets extended user info", function() {
        this.gently.expect(this.lastfm, "info", function(type, options) {
            assert.equal("user", type);
            assert.equal("username", options.user);
        });
        new Guest(this.lastfm, this.session);
    });

    it("adds extended user info to self", function() {
        this.gently.expect(this.lastfm, "info", function(type, options) {
            options.success({ name: "username", realname: "User Name" });
        });
        var guest = new Guest(this.lastfm, this.session);
        assert.ok(guest.user.name);
        assert.equal("username", guest.user.name);
        assert.equal("User Name", guest.user.realname);
    });

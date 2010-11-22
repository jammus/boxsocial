require("./common.js");
var Party = require('../lib/party').Party;
var RecentTracksStream = require('lastfm/recenttracks-stream').RecentTracksStream;
var LastFmSession = require('lastfm/lastfm-session').LastFmSession;
var FakeTracks = require('./TestData').FakeTracks;

ntest.describe("A new party");
    ntest.before(function() {
        this.lastfm = new LastFmNode();
        this.stream = new RecentTracksStream(this.lastfm, "hostuser");
        this.stream.start = function() {}; // stub start to prevent tests hanging
        this.party = new Party(this.lastfm, this.stream);
        this.gently = new Gently();
    });

    ntest.after(function() {
        if (this.stream.isStreaming) this.stream.stop();
    });

    ntest.it("has no guests", function() {
        assert.equal(0, this.party.guests.length);
    });

    ntest.it("can add guests", function() {
        var guest = new LastFmSession(this.lastfm, "guestuser1");
        this.party.addGuest(guest);
        assert.equal(1, this.party.guests.length);
        assert.ok(this.party.guests.indexOf(guest) > -1);
    });

    ntest.it("can't add a guest twice", function() {
        var guest = new LastFmSession(this.lastfm, "guestuser1");
        this.party.addGuest(guest);
        this.party.addGuest(guest);
        assert.equal(1, this.party.guests.length);
    });

    ntest.it("can't add host to guest list", function() { 
        var guest = new LastFmSession(this.lastfm, "hostuser");
        this.party.addGuest(guest);
        assert.equal(0, this.party.guests.length);
    });
    
    ntest.it("doesn't start streaming until guests arrive", function() {
        assert.ok(!this.stream.isStreaming);
        var gently = new Gently();
        gently.expect(this.stream, "start");
        var guest = new LastFmSession(this.lastfm, "guestuser1");
        this.party.addGuest(guest);
    });

ntest.describe("A party in full swing");
    ntest.before(function() {
        this.lastfm = new LastFmNode();
        this.lastfm.info = function(type, options) {
            options.success(options.track);
        };
        this.stream = new RecentTracksStream(this.lastfm, "hostuser");
        this.stream.start = function() {}; // stub start to prevent tests hanging
        this.party = new Party(this.lastfm, this.stream);
        this.guestOne = new LastFmSession(this.lastfm, "guestuser1", "authed1");
        this.guestTwo = new LastFmSession(this.lastfm, "guestuser2", "authed2");
        this.guestThree = new LastFmSession(this.lastfm, "guestthree" ,"authed3");
        this.party.addGuest(this.guestOne);
        this.party.addGuest(this.guestTwo);
        this.gently = new Gently();
    });

    ntest.after(function() {
        if (this.stream.isStreaming) this.stream.stop();
    });

    ntest.it("shares now playing events with guests", function() {
        this.gently.expect(this.lastfm, "update", function(method, session, options) {
          assert.equal("nowplaying", method);
          assert.equal("guestuser1", session.user);
          assert.equal("Run To Your Grave", options.track.name);
        });
        this.gently.expect(this.lastfm, "update", function(method, session, options) {
          assert.equal("nowplaying", method);
          assert.equal("guestuser2", session.user);
          assert.equal("Run To Your Grave", options.track.name);
        });
        this.stream.emit('nowPlaying', FakeTracks.RunToYourGrave);
    });

    ntest.it("shares now playing with new guests", function() {
        this.lastfm.update = function() {};
        this.stream.emit("nowPlaying", FakeTracks.RunToYourGrave);
        this.gently.expect(this.lastfm, "update", function(method, session, options) {
          assert.equal("nowplaying", method);
          assert.equal("guestthree", session.user);
          assert.equal("Run To Your Grave", options.track.name);
        });
        this.party.addGuest(this.guestThree);
    });

    ntest.it("shares scrobbles with guests", function() {
        this.gently.expect(this.lastfm, "update", function(method, session, options) {
          assert.equal("scrobble", method);
          assert.equal("guestuser1", session.user);
          assert.equal("Run To Your Grave", options.track.name);
        });
        this.gently.expect(this.lastfm, "update", function(method, session, options) {
          assert.equal("scrobble", method);
          assert.equal("guestuser2", session.user);
          assert.equal("Run To Your Grave", options.track.name);
        });
        this.stream.emit("scrobbled", FakeTracks.RunToYourGrave);
    });

    ntest.it("new guest doesnt receive now playing after stopped playing", function() {
        this.gently.expect(this.lastfm, "update", 2, function() {});
        this.stream.emit("nowPlaying", FakeTracks.RunToYourGrave);
        this.stream.emit("stoppedPlaying", FakeTracks.RunToYourGrave);
        this.party.addGuest(this.guestThree);
        assert.equal(null, this.guestThree.nowPlaying);
    });

    ntest.it("returns false when checked for unknown guest", function() {
        var guest = new LastFmSession(this.lastfm, "unknown", "huh");
        assert.ok(!this.party.hasGuest(guest));     
    });

    ntest.it("returns true when checked for present guest", function() {
        assert.ok(this.party.hasGuest(this.guestOne));
    });

    ntest.it("removeGuest takes guest off guest list", function() {
        this.party.removeGuest(this.guestOne);
        assert.ok(!this.party.hasGuest(this.guestOne));
    });

    ntest.it("removeGuest leaves other guests at party", function() {
        this.party.removeGuest(this.guestOne);
        assert.notEqual(0, this.party.guests.length);
        assert.ok(this.party.hasGuest(this.guestTwo));
    });

    ntest.it("stops streaming when last guest leaves", function() {
        this.party.removeGuest(this.guestOne);
        this.party.removeGuest(this.guestTwo);
        assert.ok(!this.stream.isStreaming);
    });

    ntest.it("removes all guests when over", function() {
        this.party.finish();
        assert.ok(!this.party.hasGuest(this.guestOne));
        assert.ok(!this.party.hasGuest(this.guestTwo));
        assert.equal(0, this.party.guests.length);
    });

    ntest.it("emits finished event when all guests leave", function() {
        var finished = false;
        var finishedParty = null;
        this.party.addListener("finished", function(party) {
            finished = true;
            finishedParty = party;
        }); 
        this.party.removeGuest(this.guestOne);
        assert.ok(!finished);
        this.party.removeGuest(this.guestTwo);
        assert.ok(finished);
        assert.equal(this.party, finishedParty);
    });

    ntest.it("emits finished event when finished", function() {
        var finished = false;
        var finishedParty = null;
        this.party.addListener("finished", function(party) {
            finished = true;
            finishedParty = party;
        }); 
        this.party.finish();
        assert.ok(finished);
        assert.equal(this.party, finishedParty);
    });

ntest.describe("Party using extended track info");
    ntest.before(function() {
        this.lastfm = new LastFmNode();
        this.stream = new RecentTracksStream(this.lastfm, "hostuser");
        this.stream.start = function() {}; // stub start to prevent tests hanging
        this.party = new Party(this.lastfm, this.stream);
        this.gently = new Gently();
    });

    ntest.it("gets full track info when nowPlaying changes", function() {
        this.gently.expect(this.lastfm, "info", function(type, options) {
            assert.equal("track", type);
            assert.equal(FakeTracks.RunToYourGrave, options.track);
        });
        this.stream.emit("nowPlaying", FakeTracks.RunToYourGrave);
    });

    ntest.it("includes duration in nowPlaying updates", function() {
        this.gently.expect(this.lastfm, "info", function(type, options) {
            options.success({ name: "Run To Your Grave", duration: 232000 });
        });
        this.gently.expect(this.lastfm, "update", function(method, session, options) {
            assert.equal(232000, options.duration);
        });
        var guestOne = new LastFmSession(this.lastfm, "guestuser1", "authed1");
        this.party.addGuest(guestOne);
        this.stream.emit("nowPlaying", FakeTracks.RunToYourGrave);
    });

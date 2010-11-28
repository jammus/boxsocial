require("./common.js");
var Party = require('../lib/party').Party;
var RecentTracksStream = require('lastfm/recenttracks-stream').RecentTracksStream;
var LastFmSession = require('lastfm/lastfm-session').LastFmSession;
var FakeTracks = require('./TestData').FakeTracks;
var Guest = require('../lib/guest').Guest;

function createGuest(lastfm, user, key) {
    return new Guest(lastfm, new LastFmSession(lastfm, user, key));
}

describe("A new party");
    before(function() {
        this.lastfm = new LastFmNode();
        this.stream = new RecentTracksStream(this.lastfm, "hostuser");
        this.stream.start = function() {}; // stub start to prevent tests hanging
        this.party = new Party(this.lastfm, this.stream);
        this.gently = new Gently();
    });

    after(function() {
        if (this.stream.isStreaming) this.stream.stop();
    });

    it("has no guests", function() {
        assert.equal(0, this.party.guests.length);
    });

    it("can add guests", function() {
        var guest = createGuest(this.lastfm, "guestuser1");
        this.party.addGuest(guest);
        assert.equal(1, this.party.guests.length);
        assert.ok(this.party.guests.indexOf(guest) > -1);
    });

    it("can't add a guest twice", function() {
        var guest = createGuest(this.lastfm, "guestuser1");
        this.party.addGuest(guest);
        this.party.addGuest(guest);
        assert.equal(1, this.party.guests.length);
    });

    it("can't add host to guest list", function() { 
        var guest = createGuest(this.lastfm, "hostuser");
        this.party.addGuest(guest);
        assert.equal(0, this.party.guests.length);
    });
    
    it("doesn't start streaming until guests arrive", function() {
        assert.ok(!this.stream.isStreaming);
        var gently = new Gently();
        gently.expect(this.stream, "start");
        var guest = createGuest(this.lastfm, "guestuser1");
        this.party.addGuest(guest);
    });

describe("A party in full swing");
    before(function() {
        this.lastfm = new LastFmNode();
        this.lastfm.info = function(type, options) {
            if (type == "track") options.success(options.track);
        };
        this.stream = new RecentTracksStream(this.lastfm, "hostuser");
        this.stream.start = function() {}; // stub start to prevent tests hanging
        this.party = new Party(this.lastfm, this.stream);
        this.guestOne = createGuest(this.lastfm, "guestuser1", "auth1");
        this.guestTwo = createGuest(this.lastfm, "guestuser2", "auth2");
        this.guestThree = createGuest(this.lastfm, "guestthree", "auth3");
        this.party.addGuest(this.guestOne);
        this.party.addGuest(this.guestTwo);
        this.gently = new Gently();
    });

    after(function() {
        if (this.stream.isStreaming) this.stream.stop();
    });

    it("shares now playing events with guests", function() {
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

    it("shares now playing with new guests", function() {
        this.party.nowPlaying = FakeTracks.RunToYourGrave;
        this.party.nowPlayingInfo = FakeTracks.RunToYourGrave;
        this.gently.expect(this.lastfm, "update", function(method, session, options) {
          assert.equal("nowplaying", method);
          assert.equal("guestthree", session.user);
          assert.equal("Run To Your Grave", options.track.name);
          assert.equal(232, options.duration);
        });
        this.party.addGuest(this.guestThree);
    });

    it("shares scrobbles with guests", function() {
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

    it("doesn't share nowPlaying updates with guests after they leave", function() {
        this.gently.expect(this.lastfm, "update", 1);
        this.party.removeGuest(this.guestTwo);
        this.stream.emit("nowPlaying", FakeTracks.RunToYourGrave);
    });

    it("doesn't share scrobble updates with guests after they leave", function() {
        this.gently.expect(this.lastfm, "update", 1);
        this.party.removeGuest(this.guestTwo);
        this.stream.emit("scrobbled", FakeTracks.RunToYourGrave);
    });

    it("new guest doesnt receive now playing after stopped playing", function() {
        this.gently.expect(this.lastfm, "update", 2, function() {});
        this.stream.emit("nowPlaying", FakeTracks.RunToYourGrave);
        this.stream.emit("stoppedPlaying", FakeTracks.RunToYourGrave);
        this.party.addGuest(this.guestThree);
        assert.equal(null, this.guestThree.nowPlaying);
    });

    it("returns false when checked for unknown guest", function() {
        var guest = createGuest(this.lastfm, "unknown", "huh");
        assert.ok(!this.party.hasGuest(guest));     
    });

    it("returns true when checked for present guest", function() {
        assert.ok(this.party.hasGuest(this.guestOne));
    });

    it("hasGuest is case insensitive", function() {
        var guEStonE = createGuest(this.lastfm, "guEStuSer1", "autH1");
        assert.ok(this.party.hasGuest(guEStonE));
    });

    it("removeGuest takes guest off guest list", function() {
        this.party.removeGuest(this.guestOne);
        assert.ok(!this.party.hasGuest(this.guestOne));
    });

    it("removeGuest leaves other guests at party", function() {
        this.party.removeGuest(this.guestOne);
        assert.notEqual(0, this.party.guests.length);
        assert.ok(this.party.hasGuest(this.guestTwo));
    });

    it("stops streaming when last guest leaves", function() {
        this.party.removeGuest(this.guestOne);
        this.party.removeGuest(this.guestTwo);
        assert.ok(!this.stream.isStreaming);
    });

    it("removes all guests when over", function() {
        this.party.finish();
        assert.ok(!this.party.hasGuest(this.guestOne));
        assert.ok(!this.party.hasGuest(this.guestTwo));
        assert.equal(0, this.party.guests.length);
    });

    it("emits finished event when all guests leave", function() {
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

    it("emits finished event when finished", function() {
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

describe("Party using extended track info");
    before(function() {
        this.lastfm = new LastFmNode();
        this.stream = new RecentTracksStream(this.lastfm, "hostuser");
        this.stream.start = function() {}; // stub start to prevent tests hanging
        this.party = new Party(this.lastfm, this.stream);

        this.gently = new Gently();
    });

    it("gets full track info when nowPlaying changes", function() {
        this.gently.expect(this.lastfm, "info", function(type, options) {
            assert.equal("track", type);
            assert.equal(FakeTracks.RunToYourGrave, options.track);
        });
        this.stream.emit("nowPlaying", FakeTracks.RunToYourGrave);
    });

    it("handles track info errors", function() {
        this.lastfm.info = function() {};
        var guestOne = createGuest(this.lastfm, "guestuser1", "auth1");
        this.party.addGuest(guestOne);
        this.gently.expect(this.lastfm, "info", function(type, options) {
            options.error();
        });
        this.gently.expect(this.lastfm, "update", function(method, session, options) {
            assert.equal("nowplaying", method);
            assert.equal(null, options.duration);
        });
        this.stream.emit("nowPlaying", FakeTracks.RunToYourGrave);
    });

    it("includes duration (in seconds) in nowPlaying updates", function() {
        this.gently.expect(this.lastfm, "info", function(type, options) {
            options.success({ name: "Run To Your Grave", duration: 232000 });
        });
        this.gently.expect(this.lastfm, "update", function(method, session, options) {
            assert.equal(232, options.duration);
        });
        var guestOne = createGuest(this.lastfm, "guestuser1");
        this.party.addGuest(guestOne);
        this.stream.emit("nowPlaying", FakeTracks.RunToYourGrave);
    });

describe("Party events")
    before(function() {
        this.lastfm = new LastFmNode();
        this.stream = new RecentTracksStream(this.lastfm, "hostuser");
        this.stream.start = function() {}; // stub start to prevent tests hanging
        this.party = new Party(this.lastfm, this.stream);
        this.firstGuest = createGuest(this.lastfm, "alice");
        this.party.addGuest(this.firstGuest);
        this.gently = new Gently();
    });

    it("emits guestsUpdated when guest arrives", function() {
        this.gently.expect(this.party, "emit", function(event, guests) {
            assert.equal("guestsUpdated", event);
            assert.equal(2, guests.length);
            assert.equal("alice", guests[0].session.user);
            assert.equal("steven", guests[1].session.user);
        });
        var guest = createGuest(this.lastfm, "steven");
        this.party.addGuest(guest);
    });

    it("emits guestsUpdated when guest leaves", function() {
        var that = this;
        this.gently.expect(this.party, "emit", function(event, guests) {
            assert.equal("guestsUpdated", event);
            assert.equal(0, guests.length);
            that.gently.restore(this, "emit");
        });
        this.party.removeGuest(this.firstGuest);
    });

    it("emits trackUpdated when stream's nowPlaying updates", function() {
        this.lastfm.info = function() {};
        this.lastfm.update = function() {};
        this.gently.expect(this.party, "emit", function(event, track) {
            assert.equal("trackUpdated", event);
            assert.equal("Run To Your Grave", track.name);
        });
        this.stream.emit("nowPlaying", FakeTracks.RunToYourGrave);
    });

    it("emits trackUpdated when stream stops playing", function() {
        this.lastfm.info = function() {};
        this.lastfm.update = function() {};
        this.gently.expect(this.party, "emit", function(event, track) {
            assert.equal("trackUpdated", event);
            assert.ok(!track);
        });
        this.stream.emit("stoppedPlaying");
    });

    it("removes stream listeners when party is finished", function() {
        var that = this;
        this.gently.expect(this.party, "emit", function(event) {
            assert.equal("finished", event);
            assert.equal(0, that.stream.listeners("scrobbled").length);
            assert.equal(0, that.stream.listeners("nowPlaying").length);
            assert.equal(0, that.stream.listeners("stoppedPlaying").length);
        });
        this.party.finish();
    });

describe("error handling")
    it("bubbles update errors", function() {
        var lastfm = new LastFmNode();
        var stream = lastfm.stream("someuser");
        var party = new Party(lastfm, stream);
        var gently = new Gently();
        gently.expect(lastfm, "update", function(method, session, options) {
            options.error();
        });
        gently.expect(party, "emit", function(event, error) {
            assert.equal("error", event);
            assert.equal("Error updating nowplaying for username", error.message);
        });
        party._updateGuest("nowplaying", { session: { user: "username" } }, {});
    });

require("./common.js");
var Party = require('../lib/party').Party;
var RecentTracksStream = require('lastfm/lib/lastfm/recenttracks-stream');
var LastFmSession = require('lastfm/lib/lastfm/lastfm-session');
var FakeTracks = require('./TestData').FakeTracks;
var Guest = require('../lib/guest').Guest;

function createGuest(lastfm, user, key) {
    return new Guest(lastfm, new LastFmSession(lastfm, user, key));
}

(function() {
describe("A new party");
    var lastfm, stream, party, gently;

    before(function() {
        lastfm = new LastFmNode();
        stream = new RecentTracksStream(lastfm, "hostuser");
        stream.start = function() {}; // stub start to prevent tests hanging
        party = new Party(lastfm, stream);
        gently = new Gently();
    });

    after(function() {
        if (stream.isStreaming) {
            stream.stop();
        }
    });

    it("has no guests", function() {
        assert.equal(0, party.guests.length);
    });

    it("can add guests", function() {
        var guest = createGuest(lastfm, "guestuser1");
        party.addGuest(guest);
        assert.equal(1, party.guests.length);
        assert.ok(party.guests.indexOf(guest) > -1);
    });

    it("can't add a guest twice", function() {
        var guest = createGuest(lastfm, "guestuser1");
        party.addGuest(guest);
        party.addGuest(guest);
        assert.equal(1, party.guests.length);
    });

    it("can't add host to guest list", function() { 
        var guest = createGuest(lastfm, "hostuser");
        party.addGuest(guest);
        assert.equal(0, party.guests.length);
    });
    
    it("doesn't start streaming until guests arrive", function() {
        assert.ok(!stream.isStreaming);
        var gently = new Gently();
        gently.expect(stream, "start");
        var guest = createGuest(lastfm, "guestuser1");
        party.addGuest(guest);
    });
})();

(function() {
describe("A party in full swing");
    var lastfm, stream, party, guestOne, guestTwo,
        guestThree, gently;

    before(function() {
        lastfm = new LastFmNode();
        lastfm.info = function(type, options) {
            if (type == "track") options.handlers.success(options.track);
        };
        stream = new RecentTracksStream(lastfm, "hostuser");
        stream.start = function() {}; // stub start to prevent tests hanging
        party = new Party(lastfm, stream);
        guestOne = createGuest(lastfm, "guestuser1", "auth1");
        guestTwo = createGuest(lastfm, "guestuser2", "auth2");
        guestThree = createGuest(lastfm, "guestthree", "auth3");
        party.addGuest(guestOne);
        party.addGuest(guestTwo);
        gently = new Gently();
    });

    after(function() {
        if (stream.isStreaming) stream.stop();
    });

    it("shares now playing events with guests", function() {
        var count = 1;
        gently.expect(lastfm, "update", 2, function(method, session, options) {
          assert.equal("nowplaying", method);
          assert.equal("guestuser" + count, session.user);
          assert.equal("Run To Your Grave", options.track.name);
          count++;
        });
        stream.emit('nowPlaying', FakeTracks.RunToYourGrave);
    });

    it("shares now playing with new guests", function() {
        party.nowPlaying = FakeTracks.RunToYourGrave;
        party.nowPlayingInfo = FakeTracks.RunToYourGrave;
        gently.expect(lastfm, "update", function(method, session, options) {
          assert.equal("nowplaying", method);
          assert.equal("guestthree", session.user);
          assert.equal("Run To Your Grave", options.track.name);
          assert.equal(232, options.duration);
        });
        party.addGuest(guestThree);
    });

    it("shares scrobbles with guests", function() {
        count = 1;
        gently.expect(lastfm, "update", 2, function(method, session, options) {
          assert.equal("scrobble", method);
          assert.equal("guestuser" + count, session.user);
          assert.equal("Run To Your Grave", options.track.name);
          count++;
        });
        stream.emit("scrobbled", FakeTracks.RunToYourGrave);
    });

    it("doesn't share nowPlaying updates with guests after they leave", function() {
        gently.expect(lastfm, "update", 1);
        party.removeGuest(guestTwo);
        stream.emit("nowPlaying", FakeTracks.RunToYourGrave);
    });

    it("doesn't share scrobble updates with guests after they leave", function() {
        gently.expect(lastfm, "update", 1);
        party.removeGuest(guestTwo);
        stream.emit("scrobbled", FakeTracks.RunToYourGrave);
    });

    it("new guest doesnt receive now playing after stopped playing", function() {
        gently.expect(lastfm, "update", 2, function() {});
        stream.emit("nowPlaying", FakeTracks.RunToYourGrave);
        stream.emit("stoppedPlaying", FakeTracks.RunToYourGrave);
        party.addGuest(guestThree);
        assert.equal(null, guestThree.nowPlaying);
    });

    it("returns false when checked for unknown guest", function() {
        var guest = createGuest(lastfm, "unknown", "huh");
        assert.ok(!party.hasGuest(guest));     
    });

    it("returns true when checked for present guest", function() {
        assert.ok(party.hasGuest(guestOne));
    });

    it("hasGuest is case insensitive", function() {
        var guEStonE = createGuest(lastfm, "guEStuSer1", "autH1");
        assert.ok(party.hasGuest(guEStonE));
    });

    it("removeGuest takes guest off guest list", function() {
        party.removeGuest(guestOne);
        assert.ok(!party.hasGuest(guestOne));
    });

    it("removeGuest leaves other guests at party", function() {
        party.removeGuest(guestOne);
        assert.notEqual(0, party.guests.length);
        assert.ok(party.hasGuest(guestTwo));
    });

    it("stops streaming when last guest leaves", function() {
        party.removeGuest(guestOne);
        party.removeGuest(guestTwo);
        assert.ok(!stream.isStreaming);
    });

    it("removes all guests when over", function() {
        party.finish();
        assert.ok(!party.hasGuest(guestOne));
        assert.ok(!party.hasGuest(guestTwo));
        assert.equal(0, party.guests.length);
    });

    it("emits finished event when all guests leave", function() {
        var finished = false;
        var finishedParty = null;
        party.addListener("finished", function(party) {
            finished = true;
            finishedParty = party;
        }); 
        party.removeGuest(guestOne);
        assert.ok(!finished);
        party.removeGuest(guestTwo);
        assert.ok(finished);
        assert.equal(party, finishedParty);
    });

    it("emits finished event when finished", function() {
        var finished = false;
        var finishedParty = null;
        party.addListener("finished", function(party) {
            finished = true;
            finishedParty = party;
        }); 
        party.finish();
        assert.ok(finished);
        assert.equal(party, finishedParty);
    });
})();

(function() {
describe("Party using extended track info");
    var lastfm, stream, party, gently;

    before(function() {
        lastfm = new LastFmNode();
        stream = new RecentTracksStream(lastfm, "hostuser");
        stream.start = function() {}; // stub start to prevent tests hanging
        party = new Party(lastfm, stream);

        gently = new Gently();
    });

    it("gets full track info when nowPlaying changes", function() {
        gently.expect(lastfm, "info", function(type, options) {
            assert.equal("track", type);
            assert.equal(FakeTracks.RunToYourGrave, options.track);
        });
        stream.emit("nowPlaying", FakeTracks.RunToYourGrave);
    });

    it("handles track info errors", function() {
        lastfm.info = function() {};
        var guestOne = createGuest(lastfm, "guestuser1", "auth1");
        party.addGuest(guestOne);
        gently.expect(lastfm, "info", function(type, options) {
            options.handlers.error();
        });
        gently.expect(lastfm, "update", function(method, session, options) {
            assert.equal("nowplaying", method);
            assert.equal(null, options.duration);
        });
        stream.emit("nowPlaying", FakeTracks.RunToYourGrave);
    });

    it("includes duration (in seconds) in nowPlaying updates", function() {
        gently.expect(lastfm, "info", function(type, options) {
            options.handlers.success({ name: "Run To Your Grave", duration: 232000 });
        });
        gently.expect(lastfm, "update", function(method, session, options) {
            assert.equal(232, options.duration);
        });
        var guestOne = createGuest(lastfm, "guestuser1");
        party.addGuest(guestOne);
        stream.emit("nowPlaying", FakeTracks.RunToYourGrave);
    });
})();

(function() {
describe("Party events")
    var lastfm, stream, party, firstGuest, gently;

    before(function() {
        lastfm = new LastFmNode();
        stream = new RecentTracksStream(lastfm, "hostuser");
        stream.start = function() {}; // stub start to prevent tests hanging
        party = new Party(lastfm, stream);
        firstGuest = createGuest(lastfm, "alice");
        party.addGuest(firstGuest);
        gently = new Gently();
        lastfm.info = function() {};
        lastfm.update = function() {};
    });

    it("emits guestsUpdated when guest arrives", function() {
        gently.expect(party, "emit", function(event, guests) {
            assert.equal("guestsUpdated", event);
            assert.equal(2, guests.length);
            assert.equal("alice", guests[0].session.user);
            assert.equal("steven", guests[1].session.user);
        });
        var guest = createGuest(lastfm, "steven");
        party.addGuest(guest);
    });

    it("emits guestsUpdated when guest leaves", function() {
        gently.expect(party, "emit", function(event, guests) {
            assert.equal("guestsUpdated", event);
            assert.equal(0, guests.length);
        });
        party.removeGuest(firstGuest);
    });

    it("emits trackUpdated when stream's nowPlaying updates", function() {
        gently.expect(party, "emit", function(event, track) {
            assert.equal("trackUpdated", event);
            assert.equal("Run To Your Grave", track.name);
        });
        stream.emit("nowPlaying", FakeTracks.RunToYourGrave);
    });

    it("emits trackUpdated when stream stops playing", function() {
        gently.expect(party, "emit", function(event, track) {
            assert.equal("trackUpdated", event);
            assert.ok(!track);
        });
        stream.emit("stoppedPlaying");
    });

    it("emits recentPlaysUpdated when track is scrobbled", function() {
        gently.expect(party, "emit", function(event, tracks) {
            assert.equal("recentPlaysUpdated", event);
            assert.equal("Run To Your Grave", tracks[0].name);
        });
        stream.emit("scrobbled", FakeTracks.RunToYourGrave);
    });

    it("removes stream listeners when party is finished", function() {
        gently.expect(party, "emit", function(event) {
            assert.equal("finished", event);
            assert.equal(0, stream.listeners("scrobbled").length);
            assert.equal(0, stream.listeners("nowPlaying").length);
            assert.equal(0, stream.listeners("stoppedPlaying").length);
        });
        party.finish();
    });

    it("retains error listener when party is finished", function() {
        gently.expect(party, "emit", function(event) {
            assert.equal("finished", event);
            assert.equal(1, stream.listeners("error").length);
        });
        party.finish();
    });
})();

(function() {
describe("error handling")
    var gently, lastfm, stream, party;

    before(function() {
        gently = new Gently();
        lastfm = new LastFmNode();
        stream = lastfm.stream("someuser");
        party = new Party(lastfm, stream);
    });

    it("bubbles update errors", function() {
        gently.expect(stream, "start");

        var guest = createGuest(lastfm, "username");
        party.addGuest(guest);
        gently.expect(lastfm, "info", function(type, options) {
            options.handlers.error();
        });
        gently.expect(lastfm, "update", function(method, session, options) {
            options.handlers.error();
        });
        gently.expect(party, "emit", function(event, error) {
            assert.equal("error", event);
            assert.equal("Error updating nowplaying for username", error.message);
        });
        stream.emit("nowPlaying", FakeTracks.RunToYourGrave);
    });

    it("bubbles stream errors", function() {
        var message = "Error message";
        gently.expect(party, "emit", function(event, error) {
            assert.equal("error", event);
            assert.equal(message, error.message);
        });
        stream.emit("error", new Error(message));
    });
})();

(function() {
describe("recent plays")
    var lastfm, stream, party;

    before(function() {
        lastfm = new LastFmNode();
        stream = lastfm.stream("someuser");
        party = new Party(lastfm, stream);
    });

    it("a new party has no recent plays", function() {
        assert.equal(0, party.recentPlays.length);
    });

    it("adds scrobbled tracks to the recent plays list", function() {
        stream.emit("scrobbled", FakeTracks.RunToYourGrave);
        assert.equal(1, party.recentPlays.length);
        assert.equal(FakeTracks.RunToYourGrave, party.recentPlays[0]);
    });

    it("keeps a maximum of 5 recent plays", function() {
        for (var i = 0; i < 10; i++)
            stream.emit("scrobbled", FakeTracks.RunToYourGrave);
        assert.equal(5, party.recentPlays.length);
    });

    it("stores recent plays in reverse order", function() {
        stream.emit("scrobbled", 1);
        stream.emit("scrobbled", 2);
        stream.emit("scrobbled", 3);
        assert.equal(3, party.recentPlays[0]);
        assert.equal(2, party.recentPlays[1]);
        assert.equal(1, party.recentPlays[2]);
    });
})();

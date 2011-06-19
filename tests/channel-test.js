require("./common");
var BoxSocial = require("../lib/boxsocial").BoxSocial;
var Fakes = require("./Fakes");
var Channel = require("../lib/channel").Channel;
var FakeTracks = require("./TestData").FakeTracks;

(function() {
describe("A new channel")
    var channel, boxsocial;

    before(function() {
        var lastfm = new Fakes.LastFm();
        boxsocial = new BoxSocial(lastfm);
        var guest = createGuest(lastfm, "guest", "auth");
        var party = boxsocial.attend("channelname", guest);
        channel = new Channel(party);
    });

    after(function() {
        cleanup(boxsocial);
    });

    it("has name configured", function() {
        assert.equal("channelname", channel.name);
    });
})();

(function() {
describe("A channel with one client")
    var clientOne, gently, party, channel, boxsocial;

    before(function() {
        var lastfm = new Fakes.LastFm();
        var guest = createGuest(lastfm, "guesto", "besto");
        boxsocial = new BoxSocial(lastfm);
        clientOne = new Fakes.Client({sessionId: "1234"});
        gently = new Gently();
        party = boxsocial.attend("hostname", guest);
        channel = new Channel(party);
        channel.addClient(clientOne);
    });

    after(function() {
        cleanup(boxsocial);
    });

    it("guestsUpdated sends guestlist to client", function() {
        gently.expect(clientOne, "send", function(message) {
            assert.ok(message.guestlist);
            assert.equal(2, message.guestlist.length);
        });
        party.emit("guestsUpdated", [{name: "guestone"}, {name: "guesttwo" }]);
    });

    it("trackUpdated sends track to client", function() {
        gently.expect(clientOne, "send", function(message) {
            assert.ok(message.nowPlaying);
            assert.equal(message.nowPlaying.track, FakeTracks.RunToYourGrave);
        });
        party.emit("trackUpdated", FakeTracks.RunToYourGrave);
    });

    it("trackUpdated can send null track to client", function() {
        gently.expect(clientOne, "send", function(message) {
            assert.ok(message.nowPlaying);
            assert.ok(!message.nowPlaying.track);
        });
        party.emit("trackUpdated");
    });

    it("trackUpdated sends recent recent plays to client", function() {
        var recentPlays = [FakeTracks.RunToYourGrave];
        party.recentPlays = recentPlays;
        gently.expect(clientOne, "send", function(message) {
            assert.ok(message.recentPlays);
            assert.equal(recentPlays, message.recentPlays);
        });
        party.emit("recentPlaysUpdated", recentPlays);
    });

    it("finished sends party over to client", function() {
        gently.expect(clientOne, "send", function(message) {
            assert.ok(message.partyOver);
        });
    });
})();

(function() {
describe("A channel with two clients")
    var boxsocial, channel, clientOne, clientTwo, party;

    before(function() {
        var lastfm = new Fakes.LastFm();
        boxsocial = new BoxSocial(lastfm);
        var guest = createGuest(lastfm, "guest", "auth");
        party = boxsocial.attend("channelname", guest);
        channel = new Channel(party);
        clientOne = new Fakes.Client({ sessionId: "1234" });
        clientTwo = new Fakes.Client({ sessionId: "5678" });
        channel.addClient(clientOne);
        channel.addClient(clientTwo);
    });

    after(function() {
        cleanup(boxsocial);
    });

    it("party events send a messages to both clients", function() {
        var gently = new Gently();
        var message = "message";
        gently.expect(clientOne, "send", function(message) {
            assert.ok(message.nowPlaying);
            assert.equal(message.nowPlaying.track, FakeTracks.RunToYourGrave);
        });
        gently.expect(clientTwo, "send", function(message) {
            assert.ok(message.nowPlaying);
            assert.equal(message.nowPlaying.track, FakeTracks.RunToYourGrave);
        });
        party.emit("trackUpdated", FakeTracks.RunToYourGrave);
    });

    it("removing a client stops it from receiving messages", function() {
        var gently = new Gently();
        channel.removeClient(clientOne);
        clientOne.send = function() {
            assert.ok(false, "Send should not have been called.");
        };
        gently.expect(clientTwo, "send");
        party.emit("trackUpdated", FakeTracks.RunToYourGrave);
    });

    it("removes a client onDisconnect", function() {
        var gently = new Gently();
        clientTwo.emit("disconnect");
        clientTwo.send = function() {
            assert.ok(false, "Send should not have been called.");
        };
        gently.expect(clientOne, "send");
        party.emit("trackUpdated", FakeTracks.RunToYourGrave);
    });
})();

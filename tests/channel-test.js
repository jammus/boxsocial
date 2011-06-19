require("./common");

var BoxSocial = require("../lib/boxsocial").BoxSocial,
    Fakes = require("./Fakes"),
    Channel = require("../lib/channel").Channel,
    FakeTracks = require("./TestData").FakeTracks;

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

    it("takes name from party's host", function() {
        assert.equal("channelname", channel.name);
    });
})();

(function() {
    describe("Party event:")

    var clientOne, party, channel, boxsocial, gently;

    before(function() {
        var lastfm = new Fakes.LastFm();
        var guest = createGuest(lastfm, "guesto", "besto");
        boxsocial = new BoxSocial(lastfm);
        clientOne = new Fakes.Client({sessionId: "1234"});
        party = boxsocial.attend("hostname", guest);
        channel = new Channel(party);
        channel.addClient(clientOne);
        gently = new Gently();
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

    it("trackUpdated sends recent plays to client", function() {
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

    it("messages can be sent to multiple clients", function() {
        var clientTwo = new Fakes.Client({ sessionId: "5678" });
        channel.addClient(clientTwo);
        gently.expect(clientOne, "send", receivedNowPlayingMessage);
        gently.expect(clientTwo, "send", receivedNowPlayingMessage);
        party.emit("trackUpdated", FakeTracks.RunToYourGrave);

        function receivedNowPlayingMessage(message) {
            assert.ok(message.nowPlaying);
            assert.equal(message.nowPlaying.track, FakeTracks.RunToYourGrave);
        }
    });
})();

(function() {
describe("Client removal")
    var boxsocial, channel, clientOne, clientTwo, party, gently;

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
        gently = new Gently();
    });

    after(function() {
        cleanup(boxsocial);
    });

    it("stops client from receiving messages", function() {
        channel.removeClient(clientOne);
        clientOne.send = function() {
            assert.ok(false, "Send should not have been called.");
        };
        gently.expect(clientTwo, "send");
        party.emit("trackUpdated", FakeTracks.RunToYourGrave);
    });

    it("client removed on onDisconnect", function() {
        clientTwo.emit("disconnect");
        clientTwo.send = function() {
            assert.ok(false, "Send should not have been called.");
        };
        gently.expect(clientOne, "send");
        party.emit("trackUpdated", FakeTracks.RunToYourGrave);
    });
})();

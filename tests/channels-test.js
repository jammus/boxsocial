require("./common.js");

var BoxSocial = require("../lib/boxsocial").BoxSocial,
    Channels = require("../lib/channels").Channels,
    FakeTracks = require("./TestData").FakeTracks,
    Fakes = require("./Fakes");

(function() {
    describe("a new channels instance")

    var boxsocial, channels, clientOne, clientTwo, lastfm, party, gently;

    before(function() {
        lastfm = new Fakes.LastFm();
        boxsocial = new BoxSocial(lastfm);
        channels = new Channels(boxsocial);
        clientOne = new Fakes.Client({sessionId: "1234"});
        clientTwo = new Fakes.Client({sessionId: "5678"});
        var guest = createGuest(lastfm, "guesto", "besto");
        party = boxsocial.attend("hostname", guest);
        gently = new Gently();
    });

    after(function() {
        cleanup(boxsocial);
    });

    it("has no channels", function() {
        assert.equal(0, channels.count());
    });

    it("new subscription increases channel count", function() {
        channels.subscribe("hostname", clientOne);
        assert.equal(1, channels.count());
    });

    it("a subscription to same channel does not increase channel count", function() {
        channels.subscribe("hostname", clientOne);
        channels.subscribe("hostname", clientTwo);
        assert.equal(1, channels.count());
    });

    it("channel names are case insensitive", function() {
        channels.subscribe("hostnAme", clientOne);
        channels.subscribe("hoSTName", clientTwo);
        assert.equal(1, channels.count());
    });

    it("subscribe returns the created channel", function() {
        var channel = channels.subscribe("hostname", clientOne);
        assert.equal("hostname", channel.name);
    });

    it("subscribing to channel sends current nowPlaying to client", function() {
        gently.expect(clientOne, "send", function(message) {
            assert.ok(message.nowPlaying);
            assert.equal(message.nowPlaying.track, FakeTracks.RunToYourGrave);
        });
        var guest = createGuest(lastfm, "guest", "auth");
        var party = boxsocial.attend("host", guest);
        party.nowPlaying = FakeTracks.RunToYourGrave;
        channels.subscribe("host", clientOne);
    });

    it("when all clients have been removed channel is deleted", function() {
        channels.subscribe("hostname", clientOne);
        channels.subscribe("hostname", clientTwo);
        clientOne.emit("disconnect");
        clientTwo.emit("disconnect");
        assert.equal(0, channels.count());
    });

    it("subscribing to a non-existant party does nothing", function() {
        channels.subscribe("mrnonhost", clientOne);
        assert.equal(0, channels.count());
    });
})();

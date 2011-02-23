require("./common.js");
var BoxSocial = require("../lib/boxsocial").BoxSocial;
var Channels = require("../lib/channels").Channels;
var FakeTracks = require("./TestData").FakeTracks;
var Fakes = require("./Fakes");

(function() {
describe("a new channels instance")
    var boxsocial, channels, clientOne, clientTwo, gently, lastfm, party;

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

    it("a subscription adds client to channel", function() {
        var channel = channels.subscribe("hostname", clientOne);
        assert.equal(1, channel.clients.length);
    });

    it("subscribing to channel sends current nowPlaying to client", function() {
        gently.expect(clientOne, "send", function(message) {
            assert.ok(message.nowPlaying);
            assert.equal(message.nowPlaying.track, FakeTracks.RunToYourGrave);
            gently.restore(this, "send");
        });
        var guest = createGuest(lastfm, "guest", "auth");
        var party = boxsocial.attend("host", guest);
        party.nowPlaying = FakeTracks.RunToYourGrave;
        channels.subscribe("host", clientOne);
    });
})();

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

    it("has no clients", function() {
        assert.equal(0, channel.clients.length);
    });

    it("adding a client increases count by one", function() {
        var client = new Fakes.Client({ sessionId: "1234" });
        channel.addClient(client);
        assert.equal(1, channel.clients.length);
    });
})();

(function() {
describe("A channel with two clients")
    var boxsocial, channel, clientOne, clientTwo;

    before(function() {
        var lastfm = new Fakes.LastFm();
        boxsocial = new BoxSocial(lastfm);
        var guest = createGuest(lastfm, "guest", "auth");
        var party = boxsocial.attend("channelname", guest);
        channel = new Channel(party);
        clientOne = new Fakes.Client({ sessionId: "1234" });
        clientTwo = new Fakes.Client({ sessionId: "5678" });
        channel.addClient(clientOne);
        channel.addClient(clientTwo);
    });

    after(function() {
        cleanup(boxsocial);
    });

    it("removing a client reduces count by one", function() {
        channel.removeClient(clientOne);
        assert.equal(1, channel.clients.length);
        assert.equal("5678", channel.clients[0].sessionId);
    });

    it("removes a client onDisconnect", function() {
        clientTwo.emit("disconnect");
        assert.equal(1, channel.clients.length);
        assert.equal("1234", channel.clients[0].sessionId);
    });

    it("publishing a message sends it to both clients", function() {
        var gently = new Gently();
        var message = "message";
        gently.expect(clientOne, "send", function(m) {
            assert.equal(message, m);
        });
        gently.expect(clientTwo, "send", function(m) {
            assert.equal(message, m);
        });
        channel.publish(message);
    });
})();

(function() {
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

    it("guestsUpdated sends guestlist to channel", function() {
        gently.expect(channel, "publish", function(message) {
            assert.ok(message.guestlist);
            assert.equal(2, message.guestlist.length);
        });
        party.emit("guestsUpdated", [{name: "guestone"}, {name: "guesttwo" }]);
    });

    it("trackUpdated sends track to channel", function() {
        gently.expect(channel, "publish", function(message) {
            assert.ok(message.nowPlaying);
            assert.equal(message.nowPlaying.track, FakeTracks.RunToYourGrave);
        });
        party.emit("trackUpdated", FakeTracks.RunToYourGrave);
    });

    it("trackUpdated can send null track to channel", function() {
        gently.expect(channel, "publish", function(message) {
            assert.ok(message.nowPlaying);
            assert.ok(!message.nowPlaying.track);
        });
        party.emit("trackUpdated");
    });

    it("trackUpdated sends recent recent plays to channel", function() {
        var recentPlays = [FakeTracks.RunToYourGrave];
        party.recentPlays = recentPlays;
        gently.expect(channel, "publish", function(message) {
            assert.ok(message.recentPlays);
            assert.equal(recentPlays, message.recentPlays);
        });
        party.emit("recentPlaysUpdated", recentPlays);
    });

    it("finished sends party over to channel", function() {
        gently.expect(channel, "publish", function(message) {
            assert.ok(message.partyOver);
        });
    });
})();

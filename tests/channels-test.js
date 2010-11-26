require("./common.js");
var BoxSocial = require("../lib/boxsocial").BoxSocial;
var Channels = require("../lib/channels").Channels;
var FakeTracks = require("./TestData").FakeTracks;
var Mocks = require("./Mocks");

describe("a new channels instance")
    before(function() {
        this.boxsocial = new BoxSocial();
        this.channels = new Channels(this.boxsocial);
        this.clientOne = new Mocks.MockClient({sessionId: "1234"});
        this.clientTwo = new Mocks.MockClient({sessionId: "5678"});
    });

    it("has no channels", function() {
        assert.equal(0, this.channels.count());
    });

    it("configures boxsocial", function() {
        assert.equal(this.boxsocial, this.channels.boxsocial);
    });

    it("new subscription increases channel count", function() {
        this.channels.subscribe("hostname", this.clientOne);
        assert.equal(1, this.channels.count());
    });

    it("a subscription to same channel does not increase channel count", function() {
        this.channels.subscribe("hostname", this.clientOne);
        this.channels.subscribe("hostname", this.clientTwo);
        assert.equal(1, this.channels.count());
    });

    it("subscribe returns the created channel", function() {
        var channel = this.channels.subscribe("hostname", this.clientOne);
        assert.equal("hostname", channel.name);
    });

    it("a subscription adds client to channel", function() {
        var channel = this.channels.subscribe("hostname", this.clientOne);
        assert.equal(1, channel.clients.length);
    });

describe("boxsocial event")
    before(function() {
        this.boxsocial = new BoxSocial();
        this.channels = new Channels(this.boxsocial);
        this.clientOne = new Mocks.MockClient({sessionId: "1234"});
        this.channel = this.channels.subscribe("hostname", this.clientOne);
        this.gently = new Gently();
        this.party = { host: "hostname" };
    });

    it("guestsUpdated sends guestlist to channel", function() {
        this.gently.expect(this.channel, "publish", function(message) {
            assert.ok(message.guestlist);
            assert.equal(2, message.guestlist.length);
        });
        this.boxsocial.emit("guestsUpdated", this.party, [{name: "guestone"}, {name: "guesttwo" }]);
    });

    it("trackUpdated sends track to channel", function() {
        this.gently.expect(this.channel, "publish", function(message) {
            assert.equal(message.track, FakeTracks.RunToYourGrave);
        });
        this.boxsocial.emit("trackUpdated", this.party, FakeTracks.RunToYourGrave);
    });

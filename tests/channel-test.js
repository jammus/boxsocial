require("./common");
var Mocks = require("./Mocks");
var Channel = require("../lib/channel").Channel;

describe("A new channel")
    before(function() {
        this.channel = new Channel("channelname");
    });

    it("has name configured", function() {
        assert.equal("channelname", this.channel.name);
    });

    it("has no clients", function() {
        assert.equal(0, this.channel.clients.length);
    });

    it("adding a client increases count by one", function() {
        var client = new Mocks.MockClient({ sessionId: "1234" });
        this.channel.addClient(client);
        assert.equal(1, this.channel.clients.length);
    });

describe("A channel with two clients")
    before(function() {
        this.channel = new Channel("channelname");
        this.clientOne = new Mocks.MockClient({ sessionId: "1234" });
        this.clientTwo = new Mocks.MockClient({ sessionId: "5678" });
        this.channel.addClient(this.clientOne);
        this.channel.addClient(this.clientTwo);
    });

    it("removing a client reduces count by one", function() {
        this.channel.removeClient(this.clientOne);
        assert.equal(1, this.channel.clients.length);
        assert.equal("5678", this.channel.clients[0].sessionId);
    });

    it("removes a client onDisconnect", function() {
        this.clientTwo.emit("disconnect");
        assert.equal(1, this.channel.clients.length);
        assert.equal("1234", this.channel.clients[0].sessionId);
    });

    it("publishing a message sends it to both clients", function() {
        var gently = new Gently();
        var message = "message";
        gently.expect(this.clientOne, "send", function(m) {
            assert.equal(message, m);
        });
        gently.expect(this.clientTwo, "send", function(m) {
            assert.equal(message, m);
        });
        this.channel.publish(message);
    });

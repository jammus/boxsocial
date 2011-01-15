require("./common");
var Party = require("../lib/party").Party;
var PartyMonitor = require("../lib/partymonitor").PartyMonitor;

(function() {
    describe("A party monitor");
    var timeoutDelay = 1000;
    var accuracy = 10;
    var eventDelay = 200;

    before(function() {
        lastfm = new LastFmNode();
        stream = new RecentTracksStream(lastfm, "hostuser");
        stream.start = function() {}; // stub start to prevent tests hanging
    });

    it("stops party after set amount of time", function() {
        var party = new Party(lastfm, stream);
        var startTime = (new Date()).getTime();
        var partyMonitor = new PartyMonitor(party, timeoutDelay);
        var gently = new Gently();
        gently.expect(party, "finish", function() {
            var time = (new Date()).getTime();
            assert.ok(inRange(time, startTime + timeoutDelay, accuracy));
        });
    });

    it("resets timer when party emits trackUpdated events", function() {
        var party = new Party(lastfm, stream);
        var startTime = (new Date()).getTime();
        var partyMonitor = new PartyMonitor(party, timeoutDelay);
        var gently = new Gently();
        gently.expect(party, "finish", function() {
            var time = (new Date()).getTime();
            assert.ok(inRange(time, startTime + timeoutDelay + eventDelay, accuracy));
        });
        var timeout = setTimeout(function() {
            party.emit("trackUpdated");
        }, eventDelay);
    });

    it("resets timer when party emits recentPlaysUpdated events", function() {
        var party = new Party(lastfm, stream);
        var startTime = (new Date()).getTime();
        var partyMonitor = new PartyMonitor(party, timeoutDelay);
        var gently = new Gently();
        gently.expect(party, "finish", function() {
            var time = (new Date()).getTime();
            assert.ok(inRange(time, startTime + timeoutDelay + eventDelay, accuracy));
        });
        var timeout = setTimeout(function() {
            party.emit("recentPlaysUpdated");
        }, eventDelay);
    });

    it("removed timer when party finishes naturally", function() {
        var party = new Party(lastfm, stream);
        var startTime = (new Date()).getTime();
        var partyMonitor = new PartyMonitor(party, timeoutDelay);
        var gently = new Gently();
        gently.expect(party, "finish", 1, function() {
            this.emit("finished");
        });
        party.finish();
    });

    function inRange(expected, actual, accuracy) {
        return actual >= expected - accuracy && actual <= expected + accuracy;
    }
})();

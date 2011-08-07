require("./common");
var Fakes = require("./Fakes"),
    Party = require("../lib/party").Party,
    PartyMonitor = require("../lib/partymonitor").PartyMonitor;

(function() {
    describe("A party monitor");

    var timeoutDelay = 1000,
        accuracy = 10,
        eventDelay = 200,
        gently;

    before(function() {
        lastfm = new Fakes.LastFm();
        stream = new RecentTracksStream(lastfm, "hostuser");
        gently = new Gently();
    });

    it("stops party after set amount of time", function() {
        var party = new Party(lastfm, stream);
        var startTime = (new Date).getTime();
        var partyMonitor = new PartyMonitor(party, timeoutDelay);
        gently.expect(party, "finish", function() {
            var time = (new Date()).getTime();
            assert.ok(inRange(time, startTime + timeoutDelay, accuracy));
        });
    });

    it("resets timer when party emits trackUpdated events", function() {
        var party = new Party(lastfm, stream);
        var startTime = (new Date).getTime();
        var partyMonitor = new PartyMonitor(party, timeoutDelay);
        gently.expect(party, "finish", function() {
            var time = (new Date).getTime();
            assert.ok(inRange(time, startTime + timeoutDelay + eventDelay, accuracy));
        });
        var timeout = setTimeout(function() {
            party.emit("trackUpdated");
        }, eventDelay);
    });

    it("resets timer when party emits recentPlaysUpdated events", function() {
        var party = new Party(lastfm, stream);
        var startTime = (new Date).getTime();
        var partyMonitor = new PartyMonitor(party, timeoutDelay);
        gently.expect(party, "finish", function() {
            var time = (new Date).getTime();
            assert.ok(inRange(time, startTime + timeoutDelay + eventDelay, accuracy));
        });
        var timeout = setTimeout(function() {
            party.emit("recentPlaysUpdated");
        }, eventDelay);
    });

    it("removed timer when party finishes naturally", function() {
        var party = new Party(lastfm, stream);
        var startTime = (new Date).getTime();
        var partyMonitor = new PartyMonitor(party, timeoutDelay);
        gently.expect(party, "finish", 1, function() {
            this.emit("finished");
        });
        party.finish();
    });

    function inRange(expected, actual, accuracy) {
        return actual >= expected - accuracy && actual <= expected + accuracy;
    }
})();

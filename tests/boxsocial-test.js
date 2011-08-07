require("./common.js");

var BoxSocial = require("../lib/boxsocial").BoxSocial,
    Fakes = require("./Fakes"),
    FakeTracks = require('./TestData').FakeTracks;

(function() {
    describe("a new boxsocial")

    var lastfm, boxsocial, guest, gently;

    before(function() {
        lastfm = new Fakes.LastFm();
        boxsocial = new BoxSocial(lastfm);
        guest = createGuest(lastfm, "guest");
        gently = new Gently();
    });

    after(function() {
        cleanup(boxsocial);
    });

    it("has no parties", function() {
        assert.equal(0, boxsocial.partyCount());    
    });

    it("attending a new party increases party count", function() {
        boxsocial.attend("hostuser", guest);
        assert.equal(1, boxsocial.partyCount());    
    });

    it("attending a party returns party", function() {
        var party = boxsocial.attend("host", guest);
        assert.equal("host", party.host);
    });

    it("attending a new party emits new party event", function() {
        gently.expect(boxsocial, "emit", function(event, party) {
            assert.equal("newParty", event);
        });
        boxsocial.attend("hostuser", guest);
    });
    
    it("attending an existing party does not increase party count", function() {
        var guestOne = createGuest(lastfm, "guestOne", "one"),
            guestTwo = createGuest(lastfm, "guestTwo", "two");
        boxsocial.attend("hostuser", guestTwo);
        assert.equal(1, boxsocial.partyCount());
    });

    it("reattending party has no effect", function() {
        var guestOne = createGuest(lastfm, "guestOne", "one");
        boxsocial.attend("hostuser", guestOne);
        boxsocial.attend("hostuser", guestOne);
        assert.equal(1, boxsocial.partyCount());
    });

    it("party hosts are case insensitive", function() {
        var guestOne = createGuest(lastfm, "guestOne", "one"),
            guestTwo = createGuest(lastfm, "guestTwo", "two");
        boxsocial.attend("hostuser", guestOne);
        boxsocial.attend("hosTuSEr", guestTwo);
        assert.equal(1, boxsocial.partyCount());
    });

    it("a user joining their own party does not create party", function() {
        var host = createGuest(lastfm, "host", "skhost");
        boxsocial.attend("host", host);
        assert.equal(0, boxsocial.partyCount());
    });

    it("a user joining their own party does not create party even if case is different", function() {
        var host = createGuest(lastfm, "host", "skhost");
        boxsocial.attend("HOST", host);
        assert.equal(0, boxsocial.partyCount());
    });

    it("removes party from list when it finished", function() {
        var guestOne = createGuest(lastfm, "guestOne", "sk1"),
            guestTwo = createGuest(lastfm, "guestTwo", "sk2"),
            guestThree = createGuest(lastfm, "guestThree", "sk3");

        boxsocial.attend("hostOne", guestOne);
        boxsocial.attend("hostTwo", guestTwo);
        boxsocial.attend("hostThree", guestThree);

        var party = boxsocial.findParty({ host: "hostOne" });
        party.finish();

        assert.equal(2, boxsocial.partyCount());
        party = boxsocial.findParty({ host: "hostOne" });
        assert.ok(!party);
    });
})();

(function() {
    describe("boxsocial party search")

    var lastfm, boxsocial, guestOne;

    before(function() {
        lastfm = new Fakes.LastFm();
        boxsocial = new BoxSocial(lastfm);
        guestOne = createGuest(lastfm, "guestOne", "sk1");
    });

    after(function() {
        cleanup(boxsocial);
    });
    
    it("returns nothing when searched for unknown host", function() {
        var party = boxsocial.findParty({ host: "unknownhost" });
        assert.ok(!party);
    });

    it("returns party when searched by host", function() {
        boxsocial.attend("host", guestOne);
        var party = boxsocial.findParty({ host: "host" });
        assert.ok(party);
        assert.equal("host", party.host);
    });

    it("host search is case insensitive", function() {
        boxsocial.attend("host", guestOne);
        var party = boxsocial.findParty({ host: "hOSt" });
        assert.equal("host", party.host);
    });

    it("returns nothing when searching for unknown guest", function() {
        var unknown = createGuest(lastfm, "unknownguest", "huh");
        var party = boxsocial.findParty({ guest: unknown});
        assert.ok(!party);
    });

    it("returns party when searching for known guest", function() {
        boxsocial.attend("host", guestOne);
        var party = boxsocial.findParty({ guest: guestOne });
        assert.ok(party);
        assert.equal("host", party.host);
    });
})();

(function() {
    describe("a boxsocial with one party")

    var lastfm, boxsocial, guestOne;

    before(function() {
        lastfm = new Fakes.LastFm();
        boxsocial = new BoxSocial(lastfm);
        guestOne = createGuest(lastfm, "guestOne", "sk1");
        boxsocial.attend("host", guestOne);
    });

    after(function() {
        cleanup(boxsocial);
    });

    it("leaving removes guest from their party", function() {
        boxsocial.leaveParty(guestOne);
        var party = boxsocial.findParty({ guest: guestOne });
        assert.ok(!party);
    });

    it("returns party when top 5 are requested", function() {
        var parties = boxsocial.getTopParties(5);
        assert.equal(1, parties.length);
        assert.equal("host", parties[0].host);
    });
})();

(function() {
    describe("a boxsocial with seven parties")

    var lastfm, boxsocial, guestOne;

    before(function() {
        lastfm = new Fakes.LastFm();
        boxsocial = new BoxSocial(lastfm);
        boxsocial.attend("host1", createGuest(lastfm, "guestOne", "sk1"));
        boxsocial.attend("host2", createGuest(lastfm, "guestTwo", "sk2"));
        boxsocial.attend("host3", createGuest(lastfm, "guestThree", "sk3"));
        boxsocial.attend("host4", createGuest(lastfm, "guestFour", "sk4"));
        boxsocial.attend("host5", createGuest(lastfm, "guestFive", "sk5"));
        boxsocial.attend("host6", createGuest(lastfm, "guestSix", "sk6"));
        boxsocial.attend("host7", createGuest(lastfm, "guestSeven", "sk7"));
    });

    after(function() {
        cleanup(boxsocial);
    });

    it("returns most recent parties when top five are requested", function() {
        var parties = boxsocial.getTopParties(5);
        assert.equal(5, parties.length);
        assert.equal("host7", parties[0].host);
        assert.equal("host3", parties[4].host);
    });
})();


(function() {
    describe("Party rules")

    var lastfm, boxsocial, guestOne, guestTwo;

    before(function() {
        lastfm = new Fakes.LastFm();
        boxsocial = new BoxSocial(lastfm);
        guestOne = createGuest(lastfm, "guestOne", "auth1");
        guestTwo = createGuest(lastfm, "guestTwo", "auth2");
        boxsocial.attend("host", guestOne);
    });

    after(function() {
        cleanup(boxsocial);
    });

    it("trying to join a guest's party joins the original host's", function() {
        var guestname = guestOne.session.user;
        boxsocial.attend(guestname, guestTwo);
        var party = boxsocial.findParty({host: "host"});
        assert.ok(party.hasGuest(guestTwo));
    });

    it("hosts can't be guests", function() {
        var host = createGuest(lastfm, "host", "skhost");
        boxsocial.attend("newhost", host); 
        var party = boxsocial.findParty({ guest: host });
        assert.ok(!party);
    });

    it("users can't join their own party", function() {
        var host = createGuest(lastfm, "host", "skhost");
        boxsocial.attend("host", host); 
        var party = boxsocial.findParty({ guest: host });
        assert.ok(!party);
    });

    it("guest can only be at one party", function() {
        boxsocial.attend("host", guestTwo);
        boxsocial.attend("hostTwo", guestOne);

        var partyOne = boxsocial.findParty({host: "host"});
        var partyTwo = boxsocial.findParty({host: "hostTwo"});
        
        assert.ok(!partyOne.hasGuest(guestOne));
    });

    it("parties get removed after period of inactivity", function() {
        var delay = 1000,
            boxsocial = new BoxSocial(lastfm, delay);
        boxsocial.attend("host", guestOne);
        assert.equal(1, boxsocial.partyCount());
        var timeout = setTimeout(function() {
            assert.equal(0, boxsocial.partyCount());
        }, delay);
    });
})();

(function() {
describe("boxsocial events")
    var boxsocial, guestOne, party, gently;

    before(function() {
        var lastfm = new Fakes.LastFm();
        boxsocial = new BoxSocial(lastfm);
        guestOne = createGuest(lastfm, "guestOne", "auth");
        party = boxsocial.attend("host", guestOne);
        gently = new Gently();
    });

    after(function() {
        cleanup(boxsocial);
    });

    it("bubbles up trackUpdated events", function() {
        gently.expect(boxsocial, "emit", function(event, party, track) {
            assert.equal("trackUpdated", event);
            assert.equal("host", party.host);
            assert.equal("Run To Your Grave", track.name);
        });
        party.emit("trackUpdated", FakeTracks.RunToYourGrave)
    });

    it("bubbles up recentPlaysUpdated events", function() {
        gently.expect(boxsocial, "emit", function(event, party, tracks) {
            assert.equal("recentPlaysUpdated", event);
            assert.equal("host", party.host);
            assert.equal("Run To Your Grave", tracks[0].name);
        });
        party.emit("recentPlaysUpdated", [FakeTracks.RunToYourGrave])
    });

    it("bubbles up guestsUpdated events", function() {
        gently.expect(boxsocial, "emit", function(event, party, guests) {
            assert.equal("guestsUpdated", event);
            assert.equal("host", party.host);
            assert.equal("guestOne", guests[0].session.user);
        });
        party.emit("guestsUpdated", party.guests)
    });

    it("bubbles up finished events", function() {
        gently.expect(boxsocial, "emit", function(event, party) {
            assert.equal("partyFinished", event);
            assert.equal("host", party.host);
        });
    });

    it("bubbles up error events", function() {
        var message = "Party error message";
        gently.expect(boxsocial, "emit", function(event, error) {
            assert.equal("error", event);
            assert.equal(message, error.message);
        });
        party.emit("error", new Error(message));
    });
})();

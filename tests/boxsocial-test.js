require("./common.js");
var BoxSocial = require("../lib/boxsocial").BoxSocial;
var Fakes = require("./Fakes");
var FakeTracks = require('./TestData').FakeTracks;

(function() {
describe("a new boxsocial")
    var lastfm, boxsocial, gently;

    before(function() {
        lastfm = new Fakes.LastFm();
        boxsocial = new BoxSocial(lastfm);
        gently = new Gently();
    });

    after(function() {
        cleanup(boxsocial);
    });

    it("has no parties", function() {
        assert.equal(0, boxsocial.partyCount());    
    });

    it("attending a new party increases party count", function() {
        var guest = createGuest(lastfm, "guest");
        boxsocial.attend("hostuser", guest);
        assert.equal(1, boxsocial.partyCount());    
    });

    it("attending a party returns party", function() {
        var guest = createGuest(lastfm, "guest");
        var party = boxsocial.attend("host", guest);
        assert.equal("host", party.host);
    });

    it("attending a new party emits new party event", function() {
        var guest = createGuest(lastfm, "guest");
        gently.expect(boxsocial, "emit", function(event, party) {
            assert.equal("newParty", event);
            gently.restore(this, "emit");
        });
        boxsocial.attend("hostuser", guest);
    });
    

    it("attending an existing party does not increase party count", function() {
        var guestOne = createGuest(lastfm, "guestOne", "one");
        var guestTwo = createGuest(lastfm, "guestTwo", "two");
        boxsocial.attend("hostuser", guestOne);
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
        var guestOne = createGuest(lastfm, "guestOne", "one");
        var guestTwo = createGuest(lastfm, "guestTwo", "two");
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
        var guestOne = createGuest(lastfm, "guestOne", "sk1");
        var guestTwo = createGuest(lastfm, "guestTwo", "sk2");
        var guestThree = createGuest(lastfm, "guestThree", "sk3");

        boxsocial.attend("hostOne", guestOne);
        boxsocial.attend("hostTwo", guestTwo);
        boxsocial.attend("hostThree", guestThree);

        var party = boxsocial.findParty({ host: "hostOne" });
        party.finish();

        assert.equal(2, boxsocial.parties.length);
        party = boxsocial.findParty({ host: "hostOne" });
        assert.ok(!party);
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

    it("returns nothing when searched for unknown host", function() {
        var party = boxsocial.findParty({ host: "unknownhost" });
        assert.ok(!party);
    });

    it("returns party when searched by host", function() {
        var party = boxsocial.findParty({ host: "host" });
        assert.ok(party);
        assert.equal("host", party.host);
    });

    it("host search is case insensitive", function() {
        var party = boxsocial.findParty({ host: "hOSt" });
        assert.equal("host", party.host);
    });

    it("returns nothing when searching for unknown guest", function() {
        var unknown = createGuest(lastfm, "unknownguest", "huh");
        var party = boxsocial.findParty({ guest: unknown});
        assert.ok(!party);
    });

    it("returns party when searching for known guest", function() {
        var party = boxsocial.findParty({ guest: guestOne });
        assert.ok(party);
        assert.equal("host", party.host);
    });

    it("leaving removes guest from their party", function() {
        boxsocial.leave(guestOne);
        var party = boxsocial.findParty({ guest: guestOne });
        assert.ok(!party);
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

    it("guests can't be hosts", function() {
        boxsocial.attend(guestOne.session.user, guestTwo);
        var party = boxsocial.findParty({host: guestOne.session.user});
        assert.ok(!party);
    });

    it("trying to join a guest's party instead joins the original host's", function() {
        boxsocial.attend(guestOne.session.user, guestTwo);
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

    it("guest is removed from first party when they join a second", function() {
        boxsocial.attend("host", guestTwo);
        boxsocial.attend("hostTwo", guestOne);

        var partyOne = boxsocial.findParty({host: "host"});
        var partyTwo = boxsocial.findParty({host: "hostTwo"});
        
        assert.ok(!partyOne.hasGuest(guestOne));
    });

    it("parties get removed after period of inactivity", function() {
        var delay = 1000;
        var boxsocial = new BoxSocial(lastfm, delay);
        boxsocial.attend("host", guestOne);
        assert.equal(1, boxsocial.parties.length);
        var timeout = setTimeout(function() {
            assert.equal(0, boxsocial.parties.length);
        }, delay);
    });
})();

(function() {
describe("boxsocial events")
    var boxsocial, guestOne, gently;

    before(function() {
        var lastfm = new Fakes.LastFm();
        boxsocial = new BoxSocial(lastfm);
        guestOne = createGuest(lastfm, "guestOne", "auth");
        gently = new Gently();
    });

    after(function() {
        cleanup(boxsocial);
    });

    it("bubbles up trackUpdated events", function() {
        var party = boxsocial.attend("host", guestOne);
        gently.expect(boxsocial, "emit", function(event, party, track) {
            assert.equal("trackUpdated", event);
            assert.equal("host", party.host);
            assert.equal("Run To Your Grave", track.name);
            gently.restore(boxsocial, "emit");
        });
        party.emit("trackUpdated", FakeTracks.RunToYourGrave)
    });

    it("bubbles up recentPlaysUpdated events", function() {
        var party = boxsocial.attend("host", guestOne);
        gently.expect(boxsocial, "emit", function(event, party, tracks) {
            assert.equal("recentPlaysUpdated", event);
            assert.equal("host", party.host);
            assert.equal("Run To Your Grave", tracks[0].name);
            gently.restore(boxsocial, "emit");
        });
        party.emit("recentPlaysUpdated", [FakeTracks.RunToYourGrave])
    });

    it("bubbles up guestsUpdated events", function() {
        var party = boxsocial.attend("host", guestOne);
        gently.expect(boxsocial, "emit", function(event, party, guests) {
            assert.equal("guestsUpdated", event);
            assert.equal("host", party.host);
            assert.equal("guestOne", guests[0].session.user);
            gently.restore(boxsocial, "emit");
        });
        party.emit("guestsUpdated", party.guests)
    });

    it("bubbles up finished events", function() {
        var party = boxsocial.attend("host", guestOne);
        gently.expect(boxsocial, "emit", function(event, party) {
            assert.equal("partyFinished", event);
            assert.equal("host", party.host);
        });
    });

    it("bubbles up error events", function() {
        var party = boxsocial.attend("host", guestOne);
        var message = "Party error message";
        gently.expect(boxsocial, "emit", function(event, error) {
            assert.equal("error", event);
            assert.equal(message, error.message);
            gently.restore(boxsocial, "emit");
        });
        party.emit("error", new Error(message));
    });
})();

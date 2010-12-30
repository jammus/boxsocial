require("./common.js");
var BoxSocial = require("../lib/boxsocial").BoxSocial;
var Mocks = require("./Mocks");
var Guest = require("../lib/guest").Guest;
var FakeTracks = require('./TestData').FakeTracks;

function cleanup(boxsocial) {
    while(boxsocial.parties.length > 0) {
        var party = boxsocial.parties[0];
        party.finish();
    }
}

function createGuest(lastfm, user, key) {
    return new Guest(lastfm, new LastFmSession(lastfm, user, key));
}

describe("a new boxsocial")
    before(function() {
        this.lastfm = new Mocks.MockLastFm();
        this.boxsocial = new BoxSocial(this.lastfm);
    });

    after(function() {
        cleanup(this.boxsocial);
    });

    it("has no parties", function() {
        assert.equal(0, this.boxsocial.partyCount());    
    });

    it("attending a new party increases party count", function() {
        var guest = createGuest(this.lastfm, "guest");
        this.boxsocial.attend("hostuser", guest);
        assert.equal(1, this.boxsocial.partyCount());    
    });

    it("attending a party returns party", function() {
        var guest = createGuest(this.lastfm, "guest");
        var party = this.boxsocial.attend("host", guest);
        assert.equal("host", party.host);
    });

    it("attending an existing party does not increase party count", function() {
        var guestOne = createGuest(this.lastfm, "guestOne", "one");
        var guestTwo = createGuest(this.lastfm, "guestTwo", "two");
        this.boxsocial.attend("hostuser", guestOne);
        this.boxsocial.attend("hostuser", guestTwo);
        assert.equal(1, this.boxsocial.partyCount());
    });

    it("party hosts are case insensitive", function() {
        var guestOne = createGuest(this.lastfm, "guestOne", "one");
        var guestTwo = createGuest(this.lastfm, "guestTwo", "two");
        this.boxsocial.attend("hostuser", guestOne);
        this.boxsocial.attend("hosTuSEr", guestTwo);
        assert.equal(1, this.boxsocial.partyCount());
    });

    it("a user joining their own party does not create party", function() {
        var host = createGuest(this.lastfm, "host", "skhost");
        this.boxsocial.attend("host", host);
        assert.equal(0, this.boxsocial.partyCount());
    });

    it("removes party from list when it finished", function() {
        var guestOne = createGuest(this.lastfm, "guestOne", "sk1");
        var guestTwo = createGuest(this.lastfm, "guestTwo", "sk2");
        var guestThree = createGuest(this.lastfm, "guestThree", "sk3");

        this.boxsocial.attend("hostOne", guestOne);
        this.boxsocial.attend("hostTwo", guestTwo);
        this.boxsocial.attend("hostThree", guestThree);

        var party = this.boxsocial.findParty({ host: "hostOne" });
        party.finish();

        assert.equal(2, this.boxsocial.parties.length);
        party = this.boxsocial.findParty({ host: "hostOne" });
        assert.ok(!party);
    });

describe("a boxsocial with one party")
    before(function() {
        this.lastfm = new Mocks.MockLastFm();
        this.boxsocial = new BoxSocial(this.lastfm);
        this.guestOne = createGuest(this.lastfm, "guestOne", "sk1");
        this.boxsocial.attend("host", this.guestOne);
    });

    after(function() {
        cleanup(this.boxsocial);
    });

    it("returns nothing when searched for unknown host", function() {
        var party = this.boxsocial.findParty({ host: "unknownhost" });
        assert.ok(!party);
    });

    it("returns party when searched by host", function() {
        var party = this.boxsocial.findParty({ host: "host" });
        assert.ok(party);
        assert.equal("host", party.host);
    });

    it("host search is case insensitive", function() {
        var party = this.boxsocial.findParty({ host: "hOSt" });
        assert.equal("host", party.host);
    });

    it("returns nothing when searching for unknown guest", function() {
        var unknown = createGuest(this.lastfm, "unknownguest", "huh");
        var party = this.boxsocial.findParty({ guest: unknown});
        assert.ok(!party);
    });

    it("returns party when searching for known guest", function() {
        var party = this.boxsocial.findParty({ guest: this.guestOne });
        assert.ok(party);
        assert.equal("host", party.host);
    });

    it("leaving removes guest from their party", function() {
        this.boxsocial.leave(this.guestOne);
        var party = this.boxsocial.findParty({ guest: this.guestOne });
        assert.ok(!party);
    });

describe("Party rules")
    before(function() {
        this.lastfm = new Mocks.MockLastFm();
        this.boxsocial = new BoxSocial(this.lastfm);
        this.guestOne = createGuest(this.lastfm, "guestOne", "auth1");
        this.guestTwo = createGuest(this.lastfm, "guestTwo", "auth2");
        this.boxsocial.attend("host", this.guestOne);
    });

    after(function() {
        cleanup(this.boxsocial);
    });

    it("guests can't be hosts", function() {
        this.boxsocial.attend(this.guestOne.session.user, this.guestTwo);
        var party = this.boxsocial.findParty({host: this.guestOne.session.user});
        assert.ok(!party);
    });

    it("trying to join a guest's party instead joins the original host's", function() {
        this.boxsocial.attend(this.guestOne.session.user, this.guestTwo);
        var party = this.boxsocial.findParty({host: "host"});
        assert.ok(party.hasGuest(this.guestTwo));
    });

    it("hosts can't be guests", function() {
        var host = createGuest(this.lastfm, "host", "skhost");
        this.boxsocial.attend("newhost", host); 
        var party = this.boxsocial.findParty({ guest: host });
        assert.ok(!party);
    });

    it("users can't join their own party", function() {
        var host = createGuest(this.lastfm, "host", "skhost");
        this.boxsocial.attend("host", host); 
        var party = this.boxsocial.findParty({ guest: host });
        assert.ok(!party);
    });

    it("guest is removed from first party when they join a second", function() {
        this.boxsocial.attend("host", this.guestTwo);
        this.boxsocial.attend("hostTwo", this.guestOne);

        var partyOne = this.boxsocial.findParty({host: "host"});
        var partyTwo = this.boxsocial.findParty({host: "hostTwo"});
        
        assert.ok(!partyOne.hasGuest(this.guestOne));
    });

describe("boxsocial events")
    before(function() {
        var lastfm = new Mocks.MockLastFm();
        this.boxsocial = new BoxSocial(lastfm);
        this.guestOne = createGuest(lastfm, "guestOne", "auth");
        this.gently = new Gently();
    });

    after(function() {
        cleanup(this.boxsocial);
    });

    it("bubbles up trackUpdated events", function() {
        var party = this.boxsocial.attend("host", this.guestOne);
        this.gently.expect(this.boxsocial, "emit", function(event, party, track) {
            assert.equal("trackUpdated", event);
            assert.equal("host", party.host);
            assert.equal("Run To Your Grave", track.name);
        });
        party.emit("trackUpdated", FakeTracks.RunToYourGrave)
    });

    it("bubbles up guestsUpdated events", function() {
        var party = this.boxsocial.attend("host", this.guestOne);
        this.gently.expect(this.boxsocial, "emit", function(event, party, guests) {
            assert.equal("guestsUpdated", event);
            assert.equal("host", party.host);
            assert.equal("guestOne", guests[0].session.user);
        });
        party.emit("guestsUpdated", party.guests)
    });

    it("bubbles up error events", function() {
        var party = this.boxsocial.attend("host", this.guestOne);
        var message = "Party error message";
        this.gently.expect(this.boxsocial, "emit", function(event, error) {
            assert.equal("error", event);
            assert.equal(message, error.message);
        });
        party.emit("error", new Error(message));
    });

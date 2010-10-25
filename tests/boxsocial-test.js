var ntest = require('ntest');
var assert = require('assert');
var BoxSocial = require('../lib/boxsocial.js').BoxSocial;
var LastFmNode = require('lastfm').LastFmNode;
var Mocks = require('./Mocks');

function cleanup(boxsocial) {
    for(var partyIndex in boxsocial.parties) {
        var party = boxsocial.parties[partyIndex];
        for(var guestIndex in party.guests) {
            var guest = party.guests[guestIndex];
            party.removeGuest(guest);
        }
    }
}

ntest.describe("a new boxsocial")
ntest.before(function() {
    this.lastfm = new Mocks.MockLastFm();
    this.boxsocial = new BoxSocial(this.lastfm);
});

ntest.after(function() {
    cleanup(this.boxsocial);
});

ntest.it("has no parties", function() {
    assert.equal(0, this.boxsocial.partyCount());    
});

ntest.it("attending a new party increases party count", function() {
    var guest = new LastFmSession(this.lastfm, "guest", "sk");
    this.boxsocial.attend("hostuser", guest);
    assert.equal(1, this.boxsocial.partyCount());    
});

ntest.it("attending an existing party does not increase party count", function() {
    var guestOne = new LastFmSession(this.lastfm, "guestOne", "sk1");
    var guestTwo = new LastFmSession(this.lastfm, "guestTwo", "sk2");
    this.boxsocial.attend("hostuser", guestOne);
    this.boxsocial.attend("hostuser", guestTwo);
    assert.equal(1, this.boxsocial.partyCount());
});

ntest.it("a user joining their own party does not create party", function() {
    var host = new LastFmSession(this.lastfm, "host", "skhost");
    this.boxsocial.attend("host", host);
    assert.equal(0, this.boxsocial.partyCount());
});

ntest.describe("a boxsocial with one party")
ntest.before(function() {
    this.lastfm = new Mocks.MockLastFm();
    this.boxsocial = new BoxSocial(this.lastfm);
    this.guestOne = new LastFmSession(this.lastfm, "guestOne", "sk1");
    this.boxsocial.attend("host", this.guestOne);
});

ntest.after(function() {
    cleanup(this.boxsocial);
});

ntest.it("returns nothing when searched for unknown host", function() {
    var party = this.boxsocial.findParty({ host: "unknownhost" });
    assert.ok(!party);
});

ntest.it("returns party when searched by host", function() {
    var party = this.boxsocial.findParty({ host: "host" });
    assert.ok(party);
    assert.equal("host", party.host);
});

ntest.it("returns nothing when searching for unknown guest", function() {
    var unknown = new LastFmSession(this.lastfm, "unknownguest", "huh");
    var party = this.boxsocial.findParty({ guest: unknown});
    assert.ok(!party);
});

ntest.it("returns party when searching for known guest", function() {
    var party = this.boxsocial.findParty({ guest: this.guestOne });
    assert.ok(party);
    assert.equal("host", party.host);
});

ntest.it("leaving removes guest from their party", function() {
    this.boxsocial.leave(this.guestOne);
    var party = this.boxsocial.findParty({ guest: this.guestOne });
    assert.ok(!party);
});

ntest.describe("To prevent circular references")
ntest.before(function() {
    this.lastfm = new Mocks.MockLastFm();
    this.boxsocial = new BoxSocial(this.lastfm);
    this.guestOne = new LastFmSession(this.lastfm, "guestOne", "sk1");
    this.guestTwo = new LastFmSession(this.lastfm, "guestTwo", "sk2");
    this.boxsocial.attend("host", this.guestOne);
});

ntest.after(function() {
    cleanup(this.boxsocial);
});

ntest.it("guests can't be hosts", function() {
    this.boxsocial.attend(this.guestOne.user, this.guestTwo);
    var party = this.boxsocial.findParty({host: this.guestOne.user});
    assert.ok(!party);
});

ntest.it("trying to join a guest's party instead joins the original host's", function() {
    this.boxsocial.attend(this.guestOne.user, this.guestTwo);
    var party = this.boxsocial.findParty({host: "host"});
    assert.ok(party.hasGuest(this.guestTwo));
});

ntest.it("hosts can't be guests", function() {
    var host = new LastFmSession(this.lastfm, "host", "skhost");
    this.boxsocial.attend("newhost", host); 
    var party = this.boxsocial.findParty({ guest: host });
    assert.ok(!party);
});

ntest.it("users can't join their own party", function() {
    var host = new LastFmSession(this.lastfm, "host", "skhost");
    this.boxsocial.attend("host", host); 
    var party = this.boxsocial.findParty({ guest: host });
    assert.ok(!party);
});

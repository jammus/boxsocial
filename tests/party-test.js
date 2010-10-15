var assert = require('assert');
var sys = require('sys');
var ntest = require('ntest');
var Party = require('../lib/party').Party;
var LastFmNode = require('lastfm').LastFmNode;
var FakeTracks = require('./TestData').FakeTracks;
var PartyGuest = require('../lib/partyguest').PartyGuest;

var MockGuest = function(name) {
    this.nowPlaying = null;
    this.nowPlayingCalls = 0;

    this.lastScrobbled = null;
    this.scrobbleCalls = 0;
};
MockGuest.prototype = Object.create(PartyGuest.prototype); 
MockGuest.prototype.updateNowPlaying = function(track) {
    this.nowPlaying = track;
    this.nowPlayingCalls++;
};

MockGuest.prototype.scrobble = function(track) {
    this.lastScrobbled = track;
    this.scrobbleCalls++;
};

ntest.describe("A new party");
    ntest.before(function() {
        var lastfm = new LastFmNode();
        var stream = new RecentTracksStream(lastfm, {user: 'hostuser' });
        this.party = new Party("hostuser", stream);
    });

    ntest.it("has no guests", function() {
        assert.equal(0, this.party.guests.length);
    });

    ntest.it("can add guests", function() {
        var guest = new PartyGuest("guestuser1");
        this.party.addGuest(guest);
        assert.equal(1, this.party.guests.length);
        assert.ok(this.party.guests.indexOf(guest) > -1);
    });

    ntest.it("can't add host to guest list", function() { 
        var guest = new PartyGuest("hostuser");
        this.party.addGuest(guest);
        assert.equal(0, this.party.guests.length);
    });

ntest.describe("A party in full swing");
    ntest.before(function() {
        this.lastfm = new LastFmNode();
        this.stream = new RecentTracksStream(this.lastfm, {user: 'hostuser' });
        this.party = new Party("hostuser", this.stream);
        this.guestOne = new MockGuest("guestuser1");
        this.guestTwo = new MockGuest("guestuser2");
        this.guestThree = new MockGuest("guestthree");
        this.party.addGuest(this.guestOne);
        this.party.addGuest(this.guestTwo);
    });

    ntest.it("shares now playing events with guests", function() {
        this.stream.emit('nowPlaying', FakeTracks.RunToYourGrave);
        assert.equal(1, this.guestOne.nowPlayingCalls);
        assert.equal("Run To Your Grave", this.guestOne.nowPlaying.name);
        assert.equal(1, this.guestTwo.nowPlayingCalls);
        assert.equal("Run To Your Grave", this.guestTwo.nowPlaying.name);
    });

    ntest.it("shares now playing with new guests", function() {
        this.stream.emit('nowPlaying', FakeTracks.RunToYourGrave);
        this.party.addGuest(this.guestThree);
        assert.equal(1, this.guestThree.nowPlayingCalls);
    });

    ntest.it("shares scrobbles with guests", function() {
        this.stream.emit('scrobbled', FakeTracks.RunToYourGrave);
        assert.equal(1, this.guestOne.scrobbleCalls);
        assert.equal("Run To Your Grave", this.guestOne.lastScrobbled.name);
        assert.equal(1, this.guestTwo.scrobbleCalls);
        assert.equal("Run To Your Grave", this.guestTwo.lastScrobbled.name);
    });

    ntest.it("shares stoppedPlaying with guests", function() {
        this.stream.emit('stoppedPlaying', FakeTracks.RunToYourGrave);
        assert.equal(1, this.guestOne.nowPlayingCalls);
        assert.equal(null, this.guestOne.nowPlaying);
        assert.equal(1, this.guestTwo.nowPlayingCalls);
        assert.equal(null, this.guestTwo.nowPlaying);
    });

    ntest.it("new guest doesnt receive now playing after stopped playing", function() {
        this.stream.emit('nowPlaying', FakeTracks.RunToYourGrave);
        this.stream.emit('stoppedPlaying', FakeTracks.RunToYourGrave);
        this.party.addGuest(this.guestThree);
        assert.equal(0, this.guestThree.nowPlayingCalls);
        assert.equal(null, this.guestThree.nowPlaying);
    });

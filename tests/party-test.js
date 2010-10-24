var assert = require('assert');
var sys = require('sys');
var ntest = require('ntest');
var Party = require('../lib/party').Party;
var LastFmNode = require('lastfm').LastFmNode;
var FakeTracks = require('./TestData').FakeTracks;
var LastFmMocks = require('./Mocks');

ntest.describe("A new party");
    ntest.before(function() {
        this.mockLastFm = new LastFmMocks.MockLastFm();
        this.stream = new RecentTracksStream(this.mockLastFm, "hostuser");
        this.party = new Party(this.stream);
    });

    ntest.after(function() {
        if (this.stream.isStreaming) this.stream.stop();
    });

    ntest.it("has no guests", function() {
        assert.equal(0, this.party.guests.length);
    });

    ntest.it("can add guests", function() {
        var guest = new LastFmSession(this.mockLastFm, "guestuser1");
        this.party.addGuest(guest);
        assert.equal(1, this.party.guests.length);
        assert.ok(this.party.guests.indexOf(guest) > -1);
    });

    ntest.it("can't add a guest twice", function() {
        var guest = new LastFmSession(this.mockLastFm, "guestuser1");
        this.party.addGuest(guest);
        this.party.addGuest(guest);
        assert.equal(1, this.party.guests.length);
    });

    ntest.it("can't add host to guest list", function() { 
        var guest = new LastFmSession(this.mockLastFm, "hostuser");
        this.party.addGuest(guest);
        assert.equal(0, this.party.guests.length);
    });
    
    ntest.it("doesn't start streaming until guests arrive", function() {
        assert.ok(!this.stream.isStreaming);
        var guest = new LastFmSession(this.mockLastFm, "guestuser1");
        this.party.addGuest(guest);
        assert.ok(this.stream.isStreaming);
    });


ntest.describe("A party in full swing");
    ntest.before(function() {
        this.mockLastFm = new LastFmMocks.MockLastFm();
        this.stream = new RecentTracksStream(this.mockLastFm, "hostuser");
        this.party = new Party(this.stream);
        this.guestOne = new LastFmMocks.MockLastFmSession(this.mockLastFm, "guestuser1", "authed1");
        this.guestTwo = new LastFmMocks.MockLastFmSession(this.mockLastFm, "guestuser2", "authed2");
        this.guestThree = new LastFmMocks.MockLastFmSession(this.mockLastFm, "guestthree" ,"authed3");
        this.party.addGuest(this.guestOne);
        this.party.addGuest(this.guestTwo);
    });

    ntest.after(function() {
        if (this.stream.isStreaming) this.stream.stop();
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

    ntest.it("new guest doesnt receive now playing after stopped playing", function() {
        this.stream.emit('nowPlaying', FakeTracks.RunToYourGrave);
        this.stream.emit('stoppedPlaying', FakeTracks.RunToYourGrave);
        this.party.addGuest(this.guestThree);
        assert.equal(0, this.guestThree.nowPlayingCalls);
        assert.equal(null, this.guestThree.nowPlaying);
    });

    ntest.it("returns false when checked for unknown guest", function() {
        var guest = new LastFmSession(this.mockLastFm, "unknown", "huh");
        assert.ok(!this.party.hasGuest(guest));     
    });

    ntest.it("returns true when checked for present guest", function() {
        assert.ok(this.party.hasGuest(this.guestOne));
    });

    ntest.it("removeGuest takes guest off guest list", function() {
        this.party.removeGuest(this.guestOne);
        assert.ok(!this.party.hasGuest(this.guestOne));
    });

    ntest.it("stops streaming when last guest leaves", function() {
        this.party.removeGuest(this.guestOne);
        this.party.removeGuest(this.guestTwo);
        assert.ok(!this.stream.isStreaming);
    });

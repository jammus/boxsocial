var assert = require('assert');
var sys = require('sys');
var ntest = require('ntest');
var Party = require('../lib/party').Party;
var LastFmNode = require('lastfm').LastFmNode;
var FakeTracks = require('./TestData').FakeTracks;
var PartyGuest = require('../lib/partyguest').PartyGuest;

var MockGuest = function(name) { this.nowPlayingCalls = 0; };
MockGuest.prototype = Object.create(PartyGuest.prototype); 
MockGuest.prototype.updateNowPlaying = function(track) { this.nowPlayingCalls++;};

ntest.describe("A new party");
    ntest.before(function() {
        var lastfm = new LastFmNode();
        this.party = new Party("hostuser", lastfm);
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

ntest.describe("A party in full swing");
    ntest.before(function() {
        this.lastfm = new LastFmNode();
        this.party = new Party("hostuser", this.lastfm);
        this.guestOne = new MockGuest("guestuser1");
        this.guestTwo = new MockGuest("guestuser2");
        this.party.addGuest(this.guestOne);
        this.party.addGuest(this.guestTwo);
    });

    ntest.it("shares now playing events with guests", function() {
        this.lastfm.emit('nowPlaying', FakeTracks.RunToYourGrave);
        assert.equal(1, this.guestOne.nowPlayingCalls);
        assert.equal(1, this.guestTwo.nowPlayingCalls);
    });

    ntest.it("shares now playing with new guests", function() {
        this.lastfm.emit('nowPlaying', FakeTracks.RunToYourGrave);
        var guestThree = new MockGuest("guestthree");
        this.party.addGuest(guestThree);
        assert.equal(1, guestThree.nowPlayingCalls);
    });

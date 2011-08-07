if (process.setMaxListeners) {
    process.setMaxListeners(900);
}
global.assert = require("assert");
global.ntest = require("ntest");
global.it = ntest.it;
global.describe = ntest.describe;
global.before = ntest.before;
global.after = ntest.after;
global.Gently = require("gently");

global.LastFmNode = require("lastfm").LastFmNode;
global.LastFmSession = require("lastfm/lib/lastfm/lastfm-session");
global.RecentTracksStream = require("lastfm/lib/lastfm/recenttracks-stream");

global.cleanup = function(boxsocial) {
    while(boxsocial.partyCount() > 0) {
        var party = boxsocial.getTopParties(1)[0];
        party.finish();
    }
};

var Guest = require("../lib/guest").Guest;
global.createGuest = function(lastfm, user, key) {
    return new Guest(lastfm, new LastFmSession(lastfm, user, key));
}

global.emptyFn = function() { };

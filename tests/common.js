global.assert = require("assert");
global.ntest = require("ntest");
global.it = ntest.it;
global.describe = ntest.describe;
global.before = ntest.before;
global.after = ntest.after;
global.Gently = require("gently");

global.LastFmNode = require("lastfm").LastFmNode;
global.LastFmSession = require("lastfm/lastfm-session").LastFmSession;
global.RecentTracksStream = require("lastfm/recenttracks-stream").RecentTracksStream;

global.cleanup = function(boxsocial) {
    while(boxsocial.parties.length > 0) {
        var party = boxsocial.parties[0];
        party.finish();
    }
};

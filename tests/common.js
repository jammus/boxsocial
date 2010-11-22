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

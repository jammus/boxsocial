require("./common");
var Mocks = require("./Mocks");
var BoxSocial = require("../lib/boxsocial").BoxSocial;

(function() {
    describe("The homepage")
        var gently, lastfm, boxsocial, req, res, homecontroller;

        before(function() {
            gently = new Gently();
            lastfm = new Mocks.MockLastFm();
            boxsocial = new BoxSocial(lastfm);
            req = { session:{} };
            res = {};
            homecontroller = require("../controllers/homecontroller")(lastfm, boxsocial);
        });

        after(function() {
            cleanup(boxsocial);
        });

        it("shows no parties when none are active", function() {
            gently.expect(res, "render", function(view, options) {
                var parties = options.locals.parties;
                assert.equal(0, parties.length);
            });
            homecontroller.index.get(req, res);
        });

        it("shows active parties", function() {
            boxsocial.attend("party", Mocks.createGuest(lastfm, "guest", "auth"));
            gently.expect(res, "render", function(view, options) {
                var parties = options.locals.parties;
                assert.equal(1, parties.length);
                assert.equal("party", parties[0].host);
            });
            homecontroller.index.get(req, res);
        });

        it("shows a maximum of 5 parties", function() {
            for(var i = 0; i < 10; i++)
                boxsocial.attend("party" + i, Mocks.createGuest(lastfm, "guest" + i, "auth" + i));
            gently.expect(res, "render", function(view, options) {
                var parties = options.locals.parties;
                assert.equal(5, parties.length);
            });
            homecontroller.index.get(req, res);
        });
})();

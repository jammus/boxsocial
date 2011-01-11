require("./common");
var Mocks = require("./Mocks");
var BoxSocial = require("../lib/boxsocial").BoxSocial;

(function() {
    describe("logging out")
        var gently, lastfm, boxsocial, req, res, logincontroller;

        before(function() {
            gently = new Gently();
            lastfm = new Mocks.MockLastFm();
            boxsocial = new BoxSocial(lastfm);
            req = new Mocks.MockRequest();
            res = new Mocks.MockResponse();
            logincontroller = require("../controllers/logincontroller")(lastfm, boxsocial);
        });

        after(function() {
            cleanup(boxsocial);
        });

        it("removes session", function() {
            gently.expect(req.session, "destroy");
            logincontroller.logout.post(req, res);
        });

        it("redirects to home", function() {
            gently.expect(res, "redirect", function(url) {
                assert.equal("/", url);
            });
            logincontroller.logout.post(req, res);
        });

        it("removes guest from party", function() {
            var guest = Mocks.createGuest(lastfm, "username", "auth1");
            req.session.guest = guest;
            boxsocial.attend("host", guest);
            logincontroller.logout.post(req, res);
            assert.equal(0, boxsocial.parties.length);
        });
})();

require("./controller-common");

var config = require("../config");

(function() {
    describe("The home controller")

    before(function() {
        controllerSetup("homecontroller");
    });

    after(function() {
        controllerTearDown();
    });

    it("index shows no parties when none are active", function() {
        whenViewing("index");
        expect(function(view, options) {
            var parties = options.parties;
            assert.equal(0, parties.length);
        });
    });

    it("index shows active parties", function() {
        givenThereAreActiveParties(1);
        whenViewing("index");
        expect(function(view, options) {
            var parties = options.parties;
            assert.equal(1, parties.length);
            assert.equal("party0", parties[0].host);
        });
    });

    it("index shows a maximum of 5 parties", function() {
        givenThereAreActiveParties(10);
        whenViewing("index");
        expect(function(view, options) {
            var parties = options.parties;
            assert.equal(5, parties.length);
        });
    });

    it("index uses default long title as page title", function() {
        whenViewing("index");
        thePageTitleShouldBe(config.longTitle);
    });

    it("content pages use content name and short title as page title", function() {
        whenViewing("content", { page: "about" });
        thePageTitleShouldBe("About: " + config.shortTitle);
    });
})();

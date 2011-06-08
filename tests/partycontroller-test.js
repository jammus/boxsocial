require("./controller-common");
var config = require("../config");

(function() {
    describe("The party controller")
        before(function() {
            controllerSetup("partycontroller");
        });

        after(function() {
            controllerTearDown();
        });

        it("title includes host name for active party", function() {
            givenTheresAnActiveParty("jammus", [ "guest" ]);
            whenViewing("view", { host: "jammus" });
            thePageTitleShouldBe("jammus's party: " + config.shortTitle);
        });

        it("title includes host name when party is over", function() {
            givenThereAreActiveParties(0);
            whenViewing("view", { host: "jammus" });
            thePageTitleShouldBe("jammus's party: " + config.shortTitle);
        });

        it("title is set when joining a party", function() {
            whenViewing("chose");
            andUserIsLoggedInAs("anyuser");
            thePageTitleShouldBe("Join a Party: " + config.shortTitle);
        });

        it("title is set when confirming joining a party", function() {
            whenViewing("join", { host: "jammus" });
            andUserIsLoggedInAs("anyuser");
            thePageTitleShouldBe("Join a Party: " + config.shortTitle);
        });
})();

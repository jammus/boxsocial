require("./controller-common");

var config = require("../config");

(function() {
    describe("The party controller")

    before(function() {
        controllerSetup("errorcontroller");
    });

    after(function() {
        controllerTearDown();
    });

    it("has a title set for 404", function() {
        whenError("404");
        thePageTitleShouldBe("Page not found: " + config.shortTitle);
    });

    it("has a title set for 500", function() {
        whenError("500");
        thePageTitleShouldBe("Error: " + config.shortTitle);
    });
})();

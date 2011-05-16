require("./controller-common");

(function() {
    describe("logging out")
        before(function() {
            controllerSetup("logincontroller");
        });

        after(function() {
            controllerTearDown();
        });

        it("removes session", function() {
            whenPostingTo("logout");
            sessionIsDestroyed();
        });

        it("redirects to home", function() {
            whenPostingTo("logout");
            expectRedirectTo("/");
        });

        it("removes guest from party", function() {
            givenTheresAnActiveParty("host", ["guest"]);
            andUserIsLoggedInAs("guest");
            whenPostingTo("logout");
            thereShouldBeActiveParties(0);
        });

    describe("successful log in callback")
        before(function() {
            controllerSetup("logincontroller");
        });

        it("adds user and key to session", function() {
            whenViewing("callback", { token: "token" });
            andSessionIsAuthorisedAs("username", "authenticationkey");
            theSessionShouldContain("user", "username");
            andTheSessionShouldContain("key", "authenticationkey");
        });
})();

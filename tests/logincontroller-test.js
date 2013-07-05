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

    describe("when a banned user exists")

    before(function() {
        controllerSetup("logincontroller", {
            bannedUsers: [
                "banned_user"
            ]
        });
    });
       
    it("banned users are redirected to /banned", function() {
        whenViewing("callback", { token: "token" });
        andSessionIsAuthorisedAs("banned_user", "authenticationkey");
        expectRedirectTo("/banned");
    });

    it("banned user names are case insensitive", function() {
        whenViewing("callback", { token: "token" });
        andSessionIsAuthorisedAs("baNNed_UsEr", "authenticationkey");
        expectRedirectTo("/banned");
    });

    it("other users are redirected as usual", function() {
        whenViewing("callback", { token: "token" });
        andSessionIsAuthorisedAs("good_user", "authenticationkey");
        expectRedirectTo("/");
    });

    describe("when multiple banned users exist")

    before(function() {
        controllerSetup("logincontroller", {
            bannedUsers: [
                "banned_user",
                "another_banned_user"
            ]
        });
    });

    it("other banned users are sent to banned", function() {
        whenViewing("callback", { token: "token" });
        andSessionIsAuthorisedAs("another_banned_user", "authenticationkey");
        expectRedirectTo("/banned");
    });
})();

var HomeController = require("../controllers/homecontroller"),
    LoginController = require("../controllers/logincontroller"),
    PartyController = require("../controllers/partycontroller"),
    ErrorController = require("../controllers/errorcontroller"),
    DefaultController = require("../controllers/defaultcontroller");

module.exports = {
    load: function(lastfm, boxsocial, config) {
        var homecontroller = new HomeController(lastfm, boxsocial, config);
        var logincontroller = new LoginController(lastfm, boxsocial, config);
        var partycontroller = new PartyController(lastfm, boxsocial, config);
        var errorcontroller = new ErrorController(lastfm, boxsocial, config);
        var defaultcontroller = new DefaultController(config);

        return [
            ["*", defaultcontroller.default],
            ["/", homecontroller.index],
            ["/login", logincontroller.index],
            ["/callback", logincontroller.callback],
            ["/logout", logincontroller.logout],
            ["/parties", partycontroller.index],
            ["/join", partycontroller.chose],
            ["/join/:host", partycontroller.join],
            ["/party/:host", partycontroller.view],
            ["/leave", partycontroller.leave],
            ["/:page", homecontroller.content],
    //        ["", errorcontroller]
        ];
    }
};

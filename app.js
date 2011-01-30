var express = require("express");
var io = require("socket.io");
var config = require("./config");
var BoxSocial = require("./lib/boxsocial").BoxSocial;
var LastFmNode = require("lastfm").LastFmNode;
var Channels = require("./lib/channels").Channels;
var ejs = require("ejs");
var HomeController = require("./controllers/homecontroller");
var LoginController = require("./controllers/logincontroller");
var PartyController = require("./controllers/partycontroller");
var ErrorController = require("./controllers/errorcontroller");
var DefaultController = require("./controllers/defaultcontroller");

var app = express.createServer();
app.use(express.cookieDecoder());
app.use(express.session());
app.use(express.staticProvider(__dirname + "/public"));
app.use(express.bodyDecoder());
app.set("views", __dirname + "/views");
app.get("root", __dirname);
app.set("view engine", "ejs");

var lastfm = new LastFmNode({
  api_key: config.api_key,
  secret: config.secret
});

var boxsocial = new BoxSocial(lastfm, config.partyTimeout);
boxsocial.on("error", function(error) {
    console.log("Error: " + error.message);
});

var homecontroller = new HomeController(lastfm, boxsocial, config);
var logincontroller = new LoginController(lastfm, boxsocial, config);
var partycontroller = new PartyController(lastfm, boxsocial, config);
var errorcontroller = new ErrorController();
var defaultcontroller = new DefaultController(config);

var routes = require("./routes");
routes.register(app, [
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
    ["/:page", homecontroller.content]
]);

var channels = new Channels(boxsocial);
var socket = io.listen(app);
socket.on("clientMessage", function(message, client) {
    if (message.subscribe) {
        channels.subscribe(message.subscribe, client);
    }
});

module.exports = app;

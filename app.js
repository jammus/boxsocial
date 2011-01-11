var express = require("express");
var io = require("socket.io");
var config = require("./config");
var BoxSocial = require("./lib/boxsocial").BoxSocial;
var LastFmNode = require("lastfm").LastFmNode;
var Channels = require("./lib/channels").Channels;
var ejs = require("ejs");

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

var boxsocial = new BoxSocial(lastfm);
boxsocial.on("error", function(error) {
    console.log("Error: " + error.message);
});

var homecontroller = require("./controllers/homecontroller")(lastfm, boxsocial, config);
var logincontroller = require("./controllers/logincontroller")(lastfm, boxsocial, config);
var partycontroller = require("./controllers/partycontroller")(lastfm, boxsocial, config);
var errorcontroller = require("./controllers/errorcontroller")();

var routes = require("./routes");
routes.register(app, [
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
    ["", errorcontroller]
]);

var channels = new Channels(boxsocial);
var socket = io.listen(app);
socket.on("clientMessage", function(message, client) {
    if (message.subscribe) {
        channels.subscribe(message.subscribe, client);
    }
});

module.exports = app;

var http = require("http");
var express = require("express");
var io = require("socket.io");
var config = require("./config");
var BoxSocial = require("./lib/boxsocial").BoxSocial;
var LastFmNode = require("lastfm").LastFmNode;
var Channels = require("./lib/channels").Channels;

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

var homecontroller = require("./controllers/homecontroller")(lastfm, boxsocial, config);
var logincontroller = require("./controllers/logincontroller")(lastfm, boxsocial, config);
var partycontroller = require("./controllers/partycontroller")(lastfm, boxsocial, config);
var errorcontroller = require("./controllers/errorcontroller")();

app.get("/", homecontroller.index.get);
app.get("/callback", logincontroller.callback.get);
app.get("/login", logincontroller.index.get);
app.get("/parties", partycontroller.index.get);
app.get("/join", partycontroller.chose.get);
app.post("/join", partycontroller.chose.post);
app.get("/join/:host", partycontroller.join.get);
app.post("/join/:host", partycontroller.join.post);
app.get("/party/:host", partycontroller.view.get);
app.get("/leave", partycontroller.leave.get);
app.get("/:page", homecontroller.content.get);
app.error(errorcontroller.error);

var channels = new Channels(boxsocial);
var socket = io.listen(app);
socket.on("clientMessage", function(message, client) {
    if (message.subscribe) {
        channels.subscribe(message.subscribe, client);
    }
});

module.exports = app;

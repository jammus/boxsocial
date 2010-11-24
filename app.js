var http = require("http");
var querystring = require("querystring");
var BoxSocial = require("./lib/boxsocial").BoxSocial;
var LastFmNode = require("lastfm").LastFmNode;
var Guest = require("./lib/guest").Guest;
var express = require("express");
var sys = require("sys");

var config = require("./config");

var lastfm = new LastFmNode({
  api_key: config.api_key,
  secret: config.secret
});

var app = express.createServer();
app.use(express.cookieDecoder());
app.use(express.session());
app.use(express.staticProvider(__dirname + "/public"));
app.use(express.bodyDecoder());
app.set("views", __dirname + "/views");
app.get("root", __dirname);
app.set("view engine", "ejs");

var boxsocial = new BoxSocial(lastfm);

var homecontroller = require("./controllers/homecontroller")(lastfm, boxsocial, config);
var logincontroller = require("./controllers/logincontroller")(lastfm, boxsocial, config);
var partycontroller = require("./controllers/partycontroller")(lastfm, boxsocial, config);

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

module.exports = app;

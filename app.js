var express = require("express"),
    io = require("socket.io"),
    config = require("./config"),
    BoxSocial = require("./lib/boxsocial").BoxSocial,
    LastFmNode = require("lastfm").LastFmNode,
    Channels = require("./lib/channels").Channels,
    Monitor = require("./lib/monitor"),
    ejs = require("ejs");

var app = express.createServer();
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({ secret:config.secret }));
app.use(express.static(__dirname + "/public"));
app.use(express.favicon(__dirname + "/public/img/favicon.ico"));
app.set("views", __dirname + "/views");
app.get("root", __dirname);
app.set("view engine", "ejs");
app.set("view options", { gaAccount: config.gaAccount });

var lastfm = new LastFmNode({
  api_key: config.api_key,
  secret: config.secret
});

var boxsocial = new BoxSocial(lastfm, config.partyTimeout);

var routes = require("./routes");
routes.register(app, require("./routes/default").load(lastfm, boxsocial, config));

var channels = new Channels(boxsocial);
var socket = io.listen(app);
socket.on("clientMessage", function(message, client) {
    if (message.subscribe) {
        channels.subscribe(message.subscribe, client);
    }
});

var monitor = new Monitor(boxsocial);

module.exports = app;

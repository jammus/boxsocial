var http = require("http");
var querystring = require("querystring");
var BoxSocial = require("./lib/boxsocial").BoxSocial;
var LastFmNode = require("lastfm").LastFmNode;
var express = require("express");

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

var parties = [];

app.get("/", function(req, res) {
    var fmsession = req.session.fmsession;
    var party = null;
    if (fmsession) {
        party = boxsocial.findParty({guest: fmsession});
    }

    res.render("index", {
        locals: {
            partyCount: parties.length,
            fmsession: req.session.fmsession,
            party: party
        }
    });
});

app.get("/callback/:action/:id", function(req, res) {
    var token = req.param("token");
    var fmsession = lastfm.session();
    fmsession.addListener("error", function(error) {
        res.send("Error authorising - " + error.message);
    });
    fmsession.addListener("authorised", function(session) {
        req.session.fmsession = fmsession;
        res.redirect("/" + req.params.action + "/" + req.params.id);
    });
    fmsession.authorise(token);
});

app.get("/login/:action/:id", function(req, res) {
    var appAddress = "http://" + config.host + (config.port != "80" ? ":" + config.port : "");
    var reqParams = { 
        api_key: lastfm.params.api_key,
        cb: appAddress + "/callback/" + req.params.action + "/" + req.params.id
    };
    var reqUrl = "http://last.fm/api/auth?" + querystring.stringify(reqParams);
    res.redirect(reqUrl);
});

app.get("/join", function(req, res) {
    res.render("join");        
});

app.post("/join", function(req, res) {
    var host = req.param("host");
    res.redirect("/join/" + host);
});

app.get("/join/:host", function(req, res) {
    var host = req.params.host;
    var fmsession = req.session.fmsession;
    if (!fmsession) {
        req.session.joinattempt = host;
        res.redirect("/login/join/" + host);
    }
    res.render("join_confirm", { locals: { host: host } } );
});

app.post("/join/:host", function(req, res) {
    var host = req.params.host;
    var fmsession = req.session.fmsession;
    if (!fmsession) {
        res.redirect("/login/join%3F" + host);
    }
    boxsocial.attend(host, fmsession);
    res.redirect("/party/" + host);
});

app.get("/party/:host", function(req, res) {
    var host = req.params.host;
    if (host) {
        var party = boxsocial.findParty({host: host});    
    }
    res.render("party", { locals: { fmsession: req.session.fmsession, party: party } } );
});

app.get("/leave", function(req, res) {
    var fmsession = req.session.fmsession;
    if (fmsession) {
        boxsocial.leave(fmsession);
    }
    res.redirect("/");
});

app.get("/parties", function(req, res) {
    var parties = boxsocial.parties;
    res.render("parties", { locals: { parties: parties } } );
});

module.exports = app;

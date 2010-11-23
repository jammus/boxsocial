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

var parties = [];

app.get("/", function(req, res) {
    var guest = req.session.guest;
    var party = null;
    if (guest) {
        party = boxsocial.findParty({guest: guest});
    }

    res.render("index", {
        locals: {
            partyCount: parties.length,
            guest: req.session.guest,
            party: party
        }
    });
});

app.get("/callback", function(req, res) {
    var token = req.param("token");
    var fmsession = lastfm.session();

    fmsession.addListener("error", function(error) {
        res.send("Error authorising - " + error.message);
    });

    fmsession.addListener("authorised", function(session) {
        var guest = new Guest(lastfm, session);
        req.session.guest = guest;
        var redirectUrl = req.session.redirectUrl ? req.session.redirectUrl : "/";
        req.session.redirectUrl = null;
        res.redirect(redirectUrl);
    });

    fmsession.authorise(token);
});

app.get("/login", function(req, res) {
    var callbackUrl = "http://" + config.host + (config.port != "80" ? ":" + config.port : "") + "/callback";
    var params = { 
        api_key: lastfm.params.api_key,
        cb: callbackUrl
    };
    var lastfmLogin = "http://last.fm/api/auth?" + querystring.stringify(params);
    res.redirect(lastfmLogin);
});

function checkLoggedIn(req, res, redirectUrl) {
    var guest = req.session.guest;
    if (!guest) {
        req.session.redirectUrl = redirectUrl;
        res.redirect("/login");
    }
}

app.get("/join", function(req, res) {
    checkLoggedIn(req, res, "/join");
    res.render("join", { locals: { guest: req.session.guest } });        
});

app.post("/join", function(req, res) {
    var host = req.param("host");
    checkLoggedIn(req, res, "/join/" + host);
    res.redirect("/join/" + host);
});

app.get("/join/:host", function(req, res) {
    var host = req.params.host;
    checkLoggedIn(req, res, "/join/" + host);
    res.render("join_confirm", { locals: { host: host } } );
});

app.post("/join/:host", function(req, res) {
    var host = req.params.host;
    checkLoggedIn(req, res, "/join/" + host);
    var guest = req.session.guest;
    boxsocial.attend(host, guest);
    var party = boxsocial.findParty({guest: guest});
    if (party) {
        host = party.host;
        sys.puts(guest.session.user + " has joined " + party.host + "'s party");
    }
    res.redirect("/party/" + host);
});

app.get("/party/:host", function(req, res) {
    var host = req.params.host;
    var party = boxsocial.findParty({host: host});    

    if (party) {
        res.render("party", { locals: { guest: req.session.guest, party: party } } );
    }
    res.render("noparty", { locals: { guest: req.session.guest, host: host } });
});

app.get("/leave", function(req, res) {
    var guest = req.session.guest;
    if (guest) {
        boxsocial.leave(guest);
        sys.puts(guest.session.user + " has left the party.");
    }
    res.redirect("/");
});

app.get("/parties", function(req, res) {
    var parties = boxsocial.parties;
    res.render("parties", { locals: { parties: parties } } );
});

app.get("/glossary", function(req, res) {
    res.render("glossary");
});

app.get("/:page", function(req, res) {
    res.render(req.params.page);
});

module.exports = app;

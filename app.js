var http = require('http');
var url = require('url');
var LastFmNode = require('lastfm').LastFmNode;
var Party = require('./lib/party').Party;

var lastfm = new LastFmNode({
  api_key: '',
  secret: ''
});

var stream = lastfm.createRecentTrackStream({user: 'jammus'});
stream.stream();
var party = new Party("jammus", stream);
var server = http.createServer(function(req, res) {
    var thisUrl = url.parse(req.url, true);
    var path = thisUrl.pathname;
    var params = thisUrl.query;
    switch (path) {
        case '/callback':
            var token = params.token;
            var session = lastfm.createNewSession();
            session.addListener('error', function(error) {
                console.log(error.message);
                res.end();
            });
            session.addListener('authorised', function(session) {
                party.addGuest(session);
                console.log(session.user + ' added to jammus\'s party');
                res.end();
            });
            session.authorise(token);
            break;
    } 
});

server.listen(8088);

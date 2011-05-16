require("./common");
var Fakes = require("./Fakes");
var BoxSocial = require("../lib/boxsocial").BoxSocial;
var config = require("../config");

var lastfm, boxsocial, req, res, action, controller, gently, verb, err;

function performAction() {
    if (verb != "error") {
        controller[action][verb](req, res);
        return;
    }
    controller.error(err, req, res);
}

global.controllerSetup = function(controllerName) {
    gently = new Gently();
    lastfm = new Fakes.LastFm();
    boxsocial = new BoxSocial(lastfm);
    req = new Fakes.Request();
    res = new Fakes.Response();
    err = null;
    controller = require("../controllers/" + controllerName)(lastfm, boxsocial, config);
}

global.controllerTearDown = function() {
    cleanup(boxsocial);
}

global.whenViewing = function(actionName, params) {
    action = actionName;
    req.params = params;
    verb = "get";
}

global.whenPostingTo = function(actionName) {
    action = actionName;
    verb = "post";
}

global.expect = function(expectation) {
    gently.expect(res, "render", expectation);
    performAction();
}

global.givenTheresAnActiveParty = function(host, guests) {
    for(var guest in guests) {
        party = boxsocial.attend(host, createGuest(lastfm, guests[guest], guests[guest] + "auth"));
    }
}

global.givenThereAreActiveParties = function(count) {
    for(var i = 0; i < count; i++) {
        boxsocial.attend("party" + i, createGuest(lastfm, "guest" + i, "auth" + i));
    }
}

global.thePageTitleShouldBe = function(title) {
    expect(function(view, options) {
        assert.equal(title, options.title);
    });
}

global.whenError = function(code) {
    verb = "error";
    err = new Fakes.Error(code);
}

global.sessionIsDestroyed = function() {
    gently.expect(req.session, "destroy");
    performAction();
}

global.expectRedirectTo = function(expectedUrl) {
    gently.expect(res, "redirect", function(url) {
        assert.equal(expectedUrl, url);
    });
    performAction();
}

global.andUserIsLoggedInAs = function(username) {
    var guest = createGuest(lastfm, username, username + "auth");
    req.session.guest = guest;
}

global.thereShouldBeActiveParties = function(count) {
    performAction();
    assert.equal(count, boxsocial.parties.length);
}

global.andSessionIsAuthorisedAs = function(user, key) {
    var session = new Fakes.LastFmSession(lastfm, user, key);
    session.authorise = function(token, options) {
        options.handlers.authorised(this);
    };
    lastfm.session = function() {
        return session;
    };
}

global.theSessionShouldContain = function(key, value) {
    performAction();
    andTheSessionShouldContain(key, value);
}

global.andTheSessionShouldContain = function(key, value) {
    assert.equal(req.session[key], value);
}

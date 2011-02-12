var sys = require("sys");
var _ = require("underscore");

var Monitor = module.exports = function(boxsocial) {
    boxsocial.on("newParty", function(party) {
        log(party.host + "'s party has started.");
        log(boxsocial.partyCount() + " active parties.");
    });

    boxsocial.on("guestsUpdated", function(party, guests) {
        var guestList = _(guests).reduce(function(list, guest) {
            return (list ? list + ", " : "") + guest.session.user;
        }, "");
        log(party.host + " guests updated. " + guests.length + " guest(s): " + guestList);
    });

    boxsocial.on("partyFinished", function(party) {
        log(party.host + "'s party has finished.");
        log(boxsocial.partyCount() + " active parties.");
    });

    boxsocial.on("error", function(error) {
        log("Error: " + error.message);
    });

    function log(message) {
        var time = new Date();
        sys.puts("Log[" + time.toUTCString() + "] " + message);
    }
};

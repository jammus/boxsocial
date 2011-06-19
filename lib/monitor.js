var sys = require("sys"),
    _ = require("underscore");

var Monitor = module.exports = function(boxsocial) {

    startMonitoringBoxsocial();

    function startMonitoringBoxsocial() {
        boxsocial.on("newParty", logNewParty);
        boxsocial.on("guestsUpdated", logUpdatedGuestList);
        boxsocial.on("partyFinished", logFinishedParty);
        boxsocial.on("error", logError);
    }

    function logNewParty(party) {
        log(party.host + "'s party has started.");
        log(boxsocial.partyCount() + " active parties.");
    }

    function logUpdatedGuestList(party, guests) {
        var guestList = _(guests).reduce(function(list, guest) {
            return (list ? list + ", " : "") + guest.session.user;
        }, "");
        log(party.host + " guests updated. " + guests.length + " guest(s): " + guestList);
    }

    function logFinishedParty(party) {
        log(party.host + "'s party has finished.");
        log(boxsocial.partyCount() + " active parties.");
    }
    
    function logError(error) {
        log("Error: " + error.message);
    }

    function log(message) {
        var time = new Date();
        sys.puts("Log[" + time.toUTCString() + "] " + message);
    }
};

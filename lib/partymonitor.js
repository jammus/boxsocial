var PartyMonitor = exports.PartyMonitor = function(party, delay) {
    var timeout;

    setTimer();

    party.on("trackUpdated", setTimer);
    party.on("recentPlaysUpdated", setTimer);
    party.on("finished", function() {
        clearTimeout(timeout);
    });

    function setTimer() {
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            party.finish();
        }, delay);
    }
};

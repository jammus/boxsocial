var PartyMonitor = exports.PartyMonitor = function(party, delay) {
    var timeout;
    
    startMonitoringParty();

    function startMonitoringParty() {
        startTimer();
        party.on("trackUpdated", resetTimer);
        party.on("recentPlaysUpdated", resetTimer);
        party.on("finished", stopTimer);
    }

    function resetTimer() {
        stopTimer();
        startTimer();
    }

    function startTimer() {
        timeout = setTimeout(function() {
            party.finish();
        }, delay);
    }

    function stopTimer() {
        clearTimeout(timeout);
    }
};

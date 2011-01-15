$(document).ready(function() {
    var host = $("div.host").data("host");
    var guestsTpl = new EJS({ url:"/ejs/guest.ejs" });
    var trackTpl = new EJS({ url:"/ejs/track.ejs" });

    var updateGuestlist = function(guests) {
        var html = "";
        for (var guestIndex in guests) {
            html += guestsTpl.render({guest: guests[guestIndex]});
        }
        var list = $("#guestlist");
        list.find("li").remove();
        list.append(html);
    }

    var updateNowPlaying = function(track) {
        var html = trackTpl.render({track: track });
        $("#nowPlaying").html(html);
    };

    var updateRecentPlays = function(recentplays) {
        var list = $("#recentplays");
        list.find("li").remove();
        for (var index in recentplays) {
            var li = $("<li />").html(trackTpl.render({track: recentplays[index]}));
            list.append(li);
        }
    };

    var socket = new io.Socket();
    socket.on("connect", function() {
        socket.send({subscribe: host});
    });
    socket.on("message", function(data) {
        if (data.nowPlaying) {
            updateNowPlaying(data.nowPlaying.track);
        }

        if (data.recentPlays && data.recentPlays.length > 0) {
            updateRecentPlays(data.recentPlays);
        }

        if (data.guestlist) {
            updateGuestlist(data.guestlist);
        }

        if (data.partyOver) {
            location.href = "/party/" + host;
        }
    });
    socket.connect();
});

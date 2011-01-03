$(document).ready(function() {
    var host = $("div.host").data("host");
    var guestsTpl = new EJS({ url:"/ejs/guest.ejs" });
    var nowplayingTpl = new EJS({ url:"/ejs/nowplaying.ejs" });

    var handleGuestlist = function(guests) {
        if (guests.length == 0) {
            location.href = "/party/" + host;
            return;
        }
        var html = "";
        for (var guestIndex in guests) {
            html += guestsTpl.render({guest: guests[guestIndex]});
        }
        var list = $("#guestlist");
        list.find("li").remove();
        list.append(html);
    }

    var handleNowPlaying = function(track) {
        var html = nowplayingTpl.render({nowplaying: track });
        $("#nowPlaying").html(html);
    };

    var socket = new io.Socket();
    socket.on("connect", function() {
        socket.send({subscribe: host});
    });
    socket.on("message", function(data) {
        if (data.nowPlaying) {
            handleNowPlaying(data.nowPlaying.track);
        }
        if (data.guestlist) {
            handleGuestlist(data.guestlist);
        }
    });
    socket.connect();
});

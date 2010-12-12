$(document).ready(function() {
    var host = $("div.host").data("host");
    var guestsTpl = new EJS({ url:"/ejs/guests.ejs" });
    var nowplayingTpl = new EJS({ url:"/ejs/nowplaying.ejs" });

    var handleGuestlist = function(guests) {
        if (guests.length == 0) {
            location.href = "/party/" + host;
            return;
        }
        var html = guestsTpl.render({guests: guests});
        var list = $("#guestlist");
        list.find("li").not(".header").remove();
        list.append(html);
        list.listview("refresh");
    }

    var handleNowPlaying = function(track) {
        var html = nowplayingTpl.render({party: {nowPlaying: track }});
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

$(document).ready(function() {
    var host = $("div.host").data("host");

    var handleGuestlist = function(guests) {
        if (guests.length == 0) {
            location.href = "/party/" + host;
        }
        else {
            var list = $("#guestlist");
            list.find("li").not(".header").remove();
            for(var index in guests) {
                var li = $("<li>");
                var guest = guests[index];
                if (guest.user && guest.user.image[2]["#text"]) {
                    li.append($("<img>").attr("src", "http://getthumbsup.com/88b65e?url=" + guest.user.image[2]["#text"].replace("http://", "") + "&h=80&w=80"));
                }
                li.append($("<a>").attr("href", "http://www.last.fm/user/" + guest.session.user).text(guest.session.user));
                list.append(li);
            }
            list.listview("refresh");
        }

    }

    var handleNowPlaying = function(track) {
        var np = $("#nowPlaying");
        np.empty();
        if (track) {
            if (track.image[2]["#text"]) {
               np.append($("<img>").attr("src", track.image[2]["#text"])); 
            }
            np.append("Now playing: " + track.name + " by " + track.artist["#text"]);
        }
        else {
            np.append("Now playing: Nothing");
        }
    }

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

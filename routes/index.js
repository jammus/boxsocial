module.exports = {
    register: function(app, routes) {
        if (!(routes[0] instanceof Array)) routes = [routes];
        routes.forEach(function(route) {
            var url = route[0];
            var controller = route[1];

            ["all", "get", "post", "put", "delete"].forEach(function(verb) {
                var handler = controller[verb];
                if (handler) app[verb](url, handler);
            });

            if (controller.error) {
                app.error(controller.error);
            }
        });
    }
};

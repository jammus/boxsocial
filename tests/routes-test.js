require("./common.js");

(function() {
    describe("a route")

    var app, gently;

    before(function() {
        app = function() {};
        gently = new Gently();
    });

    it("can register all http verb handlers", function() {
        var controller = {
            index: {
                get: function(req, res) {
                },
                post: function(req, res) {
                },
                put: function(req, res) {
                },
                delete: function(req, res) {
                }
            }
        };

        gently.expect(app, "get", function(url, handler) {
            assert.equal("/", url);
            assert.equal(controller.index.get, handler);
        });

        gently.expect(app, "post", function(url, handler) {
            assert.equal("/", url);
            assert.equal(controller.index.post, handler);
        });

        gently.expect(app, "put", function(url, handler) {
            assert.equal("/", url);
            assert.equal(controller.index.put, handler);
        });

        gently.expect(app, "delete", function(url, handler) {
            assert.equal("/", url);
            assert.equal(controller.index.delete, handler);
        });

        var route = ["/", controller.index];
        require("../routes").register(app, route);
    });

    it("can register an error handler", function() {
        var controller = {
            error: function() {
            }
        };
        gently.expect(app, "error", function(handler) {
            assert.equal(controller.error, handler);
        });
        var route = ["", controller];
        require("../routes").register(app, route);
    });

    it("can register multiple routes", function() {
        var controller = {
            index: {
                get: function() {}
            },
            view: {
                get: function() {}
            } 
        };
        gently.expect(app, "get", function(url, handler) {
            assert.equal("/", url);
            assert.equal(controller.index.get, handler);
        });
        gently.expect(app, "get", function(url, handler) {
            assert.equal("/view", url);
            assert.equal(controller.view.get, handler);
        });
        var routes = [["/", controller.index], ["/view", controller.view]];
        require("../routes").register(app, routes);
    });
})();

require("./common.js");

describe("a route")
    before(function() {
        this.app = function() {};
        this.gently = new Gently();
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
        this.gently.expect(this.app, "get", function(url, handler) {
            assert.equal("/", url);
            assert.equal(controller.index.get, handler);
        });
        this.gently.expect(this.app, "post", function(url, handler) {
            assert.equal("/", url);
            assert.equal(controller.index.post, handler);
        });
        this.gently.expect(this.app, "put", function(url, handler) {
            assert.equal("/", url);
            assert.equal(controller.index.put, handler);
        });
        this.gently.expect(this.app, "delete", function(url, handler) {
            assert.equal("/", url);
            assert.equal(controller.index.delete, handler);
        });
        var route = ["/", controller.index];
        require("../routes").register(this.app, route);
    });

    it("can register an error handler", function() {
        var controller = {
            error: function(req, res) {
            }
        };
        this.gently.expect(this.app, "error", function(handler) {
            assert.equal(controller.error, handler);
        });
        var route = ["", controller];
        require("../routes").register(this.app, route);
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
        this.gently.expect(this.app, "get", function(url, handler) {
            assert.equal("/", url);
            assert.equal(controller.index.get, handler);
        });
        this.gently.expect(this.app, "get", function(url, handler) {
            assert.equal("/view", url);
            assert.equal(controller.view.get, handler);
        });
        var routes = [["/", controller.index], ["/view", controller.view]];
        require("../routes").register(this.app, routes);
    });

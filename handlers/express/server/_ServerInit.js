/**
*
* @factory
*/
function _ServerInit(
    promise
    , $route$_nodeExpress
    , $route$_node_path
    , $route$_nodeDirName
    , $route$_handlers_apps
    , $route$_handlers_routers
    , $route$_handlers_middlewares
    , $route$_handlers_params
    , $route$_nodeCompression
    , $route$_routeKit
    , $route$_reporter
    , $route$_defaults
    , $route$_infos
    , $route$_errors
    , is_empty
    , is_nill
    , is_array
    , is_object
) {
    /**
    * @alias
    */
    var nodeExpress = $route$_nodeExpress
    /**
    * @alias
    */
    , node_path = $route$_node_path
    /**
    * @alias
    */
    , nodeDirName = $route$_nodeDirName
    /**
    * A container to hold the various type handlers allowing us to look them up programatically
    * @property
    */
    , typeHandlers = {
        "app": $route$_handlers_apps
        , "router": $route$_handlers_routers
        , "middleware": $route$_handlers_middlewares
        , "param": $route$_handlers_params
    }
    /**
    * @alias
    */
    , appHandlers = $route$_handlers_apps
    /**
    * @alias
    */
    , routerHandlers = $route$_handlers_routers
    /**
    * @alias
    */
    , middlewareHandlers = $route$_handlers_middlewares
    /**
    * @alias
    */
    , paramHandlers = $route$_handlers_params
    /**
    * @alias
    */
    , nodeCompression = $route$_nodeCompression
    /**
    * @alias
    */
    , routeKit = $route$_routeKit
    /**
    * @alias
    */
    , reporter = $route$_reporter
    /**
    * @alias
    */
    , defaults = $route$_defaults
    /**
    * @alias
    */
    , infos = $route$_infos
    /**
    * @alias
    */
    , errors = $route$_errors
    /**
    * A regexp pattern for matching regular expressions in path strings
    * @property
    */
    , REGEX_PATT = /^:\/(.*)\/([gim]{0,3})$/
    /**
    * A regexp pattern for replacing the leading slash
    * @property
    */
    , LEADING_SLASH = /^[\/]+/
    /**
    * A regexp pattern for replacing the trailing slash
    * @property
    */
    , TRAILING_SLASH = /[\/]+$/
    ;

    /**
    * @worker
    */
    return function ServerInit() {
        var server = {
            "apps": {}
        };

        //create the express apps
        return new promise(
            createApps
        )
        //then add the routers, middleware and params to the apps
        .then(function thenAddToApps(apps) {
            server.apps = apps;
            return new promise(
                addToApps.bind(null, server)
            );
        })
        //then return the application collection
        .then(function thenReturnApps() {
            return promise.resolve(server.apps);
        });
    };

    /**
    * Creates express servers for each app in the route kit's apps
    * @function
    */
    function createApps(resolve, reject) {
        try {
            var apps = {};

            Object.keys(routeKit.apps)
            .forEach(function forEachAppKey(appKey) {
                apps[appKey] = createApp(
                    appKey
                );
            });

            resolve(apps);
        }
        catch(ex) {
            reject(ex);
        }
    }
    /**
    * Creates the express application and adds the entry point as the first router
    * @function
    */
    function createApp(appKey) {
        var app = nodeExpress();
        ///LOGGING
        reporter.info(
            infos.creating_app
            , appKey
        );
        ///END LOGGING
        return app;
    }
    /**
    * Adds the routers, middleware and params to the apps that use them
    * @function
    */
    function addToApps(server, resolve, reject) {
        try {
            //loop through the apps, setting up the routers, middleware, etc..
            Object.keys(server.apps)
            .forEach(function forEachAppKey(appKey) {
                addToApp(
                    appKey
                    , server
                );
            });

            resolve();
        }
        catch(ex) {
            reject(ex);
        }
    }
    /**
    * Starts by adding the params to the app, then the pre-router middleware (authentication,authorization,etc...), then the routers, then the statics and then the post router middlware(error handling,post router processes)
    * @function
    */
    function addToApp(appKey, server) {
        var meta = routeKit.apps[appKey]
        , app = server.apps[appKey];

        //see if the app is using the built-in json, middleware
        if (meta.hasOwnProperty("useJsonParsing")) {
            ///LOGGING
            reporter.info(
                infos.adding_json_parsing
                , appKey
            );
            ///END LOGGING
            app.use(
                nodeExpress.json(
                    meta.useJsonParsing
                )
            );
        }
        //add the params
        addParams(app, meta.params, "app");
        //add the pre-router middleware
        addMiddlewares(appKey, server, meta.middlewares, false);
        //add the routers
        addRouters(appKey, server, meta.routers);
        //add the statics
        addStatics(appKey, server);
        // add the post router middlesware
        addMiddlewares(appKey, server, meta.middlewares, true);
        //see if the app is using the built-in json, middleware
        if (meta.hasOwnProperty("useCompression")) {
            ///LOGGING
            reporter.info(
                infos.adding_compression
                , appKey
            );
            ///END LOGGING
            app.use(
                nodeCompression(
                    meta.useCompression
                )
            );
        }
    }
    /**
    *
    * @function
    */
    function addMiddlewares(appKey, server, middlwareKeys, postRouters) {
        var app = server.apps[appKey]
        , appPath = routeKit.apps[appKey].path
        , handlers = typeHandlers.middleware;
        //loop through the middleware keys and process the ones that match the postRouters switch
        middlwareKeys.forEach(function forEachKey(middlewareKey) {
            var afterRouters = false;
            if (is_object(middlewareKey)) {
                afterRouters = middlewareKey.afterRouters;
                middlewareKey = middlewareKey.name;
            }
            //if this is not a match for the post routers, skip
            if (!!afterRouters === postRouters) {
                addMiddleware(
                    middlewareKey
                    , app
                    , appPath
                    , handlers[middlewareKey]
                );
            }
        });
    }
    /**
    * @function
    */
    function addMiddleware(middlewareKey, app, appPath, handler) {
        var meta = routeKit.middlewares[middlewareKey]
        , paths = getPath(
            meta.path
            , appPath
        )
        , methods = meta.methods;
        //loop through the methods
        methods.forEach(function forEachMethod(method) {
            method = method.toLowerCase();
            //loop through the paths and add the method with each path
            paths.forEach(function forEachPath(path) {
                ///LOGGING
                reporter.info(
                    infos.adding_middleware
                    , [
                        middlewareKey
                        , path
                    ]
                );
                ///END LOGGING
                if (path === "*") {
                    app[method](handler);
                }
                else {
                    app[method](path, handler);
                }
            });
        });
    }
    /**
    * @function
    */
    function addStatics(appKey, server) {
        var expressApp = server.apps[appKey]
        , appMeta = routeKit.apps[appKey]
        , statics = appMeta.statics;

        statics.forEach(function forEachPath(path) {
            var fullPath = node_path.join(
                nodeDirName,
                path
            )
            , static = nodeExpress.static(
                fullPath
            );

            expressApp.use(static);
        });
    }
    /**
    * Adds the routers to the app, using the `use` method
    * @function
    */
    function addRouters(appKey, server, routerKeys) {
        var app = server.apps[appKey]
        , appPath = routeKit.apps[appKey].path
        , router = nodeExpress.Router()
        ;
        //loop through the router keys
        routerKeys.forEach(function forEachKey(routerKey) {
            addRouterHandler(
                routerKey
                , router
                , app
            );
        });

        app.use(appPath, router);
    }
    /**
    * @function
    */
    function addRouterHandler(routerKey, router, app) {
        //first entry is always the routerkey
        var meta = routeKit.routers[routerKey]
        , handler = typeHandlers.router[routerKey]
        , methods = meta.methods
        , params = meta.params
        , paths = getPath(
            meta.path
        );

        //add any params to the router
        if (!!params) {
            addParams(router, params, "router");
        }

        //add a route to the router for each method
        methods.forEach(function forEachMethod(method) {
            method = method.toLowerCase();
            //add each path to this router for this method
            paths.forEach(function forEachPath(path) {
                ///LOGGING
                reporter.info(
                    infos.adding_router
                    , [
                        routerKey
                        , method
                        , path
                    ]
                );
                ///END LOGGING
                if (path === "*") {
                    router[method](handler);
                }
                else {
                    router[method](path, handler);
                }
            });
        });
    }
    /**
    * @function
    */
    function addParams(item, paramKeys, type) {
        var handlers = typeHandlers.param;

        paramKeys
        .forEach(function forEachParamKey(paramKey) {
            var paramMeta = routeKit.params[paramKey]
            , handler = handlers[paramKey];
            ///LOGGING
            reporter.info(
                infos.adding_param
                , [
                    paramKey
                    , type
                    , paramMeta.params
                ]
            );
            ///END LOGGING
            paramMeta.params
            .forEach(function forEachParam(param) {
                item.param(
                    param
                    , handler
                );
            });
        });
    }
    /**
    * Gets the path from the meta data, converting it to RegExp if needed
    * @function
    */
    function getPath(paths, appPath) {
        //allow no path
        if (is_nill(paths)) {
            return [appPath];
        }

        //if the path is empty then use a wildcard
        if (is_empty(paths)) {
            if (!!appPath) {
                return [`/${appPath}`];
            }
            return ["*"];
        }

        //convert the path to an array
        if (!is_array(paths)) {
            paths = [paths];
        }

        //remove the trailing slash
        appPath = !!appPath && appPath.replace(TRAILING_SLASH, "");

        //add the app path to the path and test for regexp
        return paths.map(function forEachPath(path) {
            //remove any leading slashes
            path = path.replace(LEADING_SLASH, "");
            if (!!appPath) {
                path = `/${appPath}/${path}`;
            }
            else {
                path = `/${path}`;
            }

            //test for regexp and convert if so
            var match = REGEX_PATT.exec(path);
            if (!!match) {
                path = new RegExp(match[1], match[2]);
            }

            return path;
        });
    }
}
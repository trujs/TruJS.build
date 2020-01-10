/**
*
* @factory
*   @singleton
*/
function _Server(
    promise
    , $route$_serverInit
    , $route$_nodeHttp
    , $route$_nodeHttps
    , $route$_nodeExpress
    , $route$_reporter
    , $route$_defaults
    , $route$_infos
    , $route$_errors
    , processDetails
    , utils_merge
    , is_nill
) {
    /**
    * @alias
    */
    var serverInit = $route$_serverInit
    /**
    * @alias
    */
    , nodeHttp = $route$_nodeHttp
    /**
    * @alias
    */
    , nodeHttps = $route$_nodeHttps
    /**
    * @alias
    */
    , nodeExpress = $route$_nodeExpress
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
    * A container for the server config
    * @property
    */
    , serverConfig
    /**
    * A variable to store the server's state
    * @property
    *   @option uninitialized
    *   @option initialized
    *   @option stopped
    *   @option starting
    *   @option running
    */
    , serverStatus = "uninitialized"
    /**
    * A container to hold the apps that are created during initialization
    * @property
    */
    , appList
    /**
    * A container for the http/https servers
    * @property
    */
    , servers = {}
    /**
    * @property
    */
    , lastPort
    ;

    /**
    * @worker
    */
    return Object.create(null, {
        /**
        * Initializes the server if not already, and then start the apps
        * @methd
        */
        "listen": {
            "enumerable": true
            , "value": function listen(config) {
                //see if we're already running
                if (serverStatus === "running") {
                    return promise.reject(
                        new Error(
                            errors.server_running
                        )
                    );
                }
                var proc = promise.resolve();
                //if we haven't initialized the server yet, do that
                if (serverStatus === "uninitialized") {
                    proc = proc.then(function thenInitServer() {
                        ///LOGGING
                        reporter.info(
                            infos.initializing_server
                        );
                        ///END LOGGING
                        return initServer(config);
                    })
                    //then save the apps and set the status
                    .then(function thenSaveApps(apps) {
                        appList = apps;
                        serverStatus = "initialized";
                        return promise.resolve();
                    });
                }
                //start the server
                proc = proc.then(function thenStartServer() {
                    ///LOGGING
                    reporter.info(
                        infos.starting_server
                    );
                    ///END LOGGING
                    serverStatus = "starting";
                    return new promise(
                        startServers
                    );
                });
                //set the status
                return proc.then(function thenSetStatus() {
                    serverStatus = "running";
                    return promise.resolve();
                });
            }
        }
        /**
        * If the server is listening, this stops it
        * @methd
        */
        , "shutdown": {
            "enumerable": true
            , "value": function shutdown() {
                if (serverStatus === "running") {
                    stopServers();
                    serverStatus = "stopped";
                }
            }
        }
    });

    /**
    * @function
    */
    function initServer(config) {
        try {
            //set the config
            serverConfig = utils_merge(
                config
                , defaults.config
            );
            //initialize the apps
            return serverInit();
        }
        catch(ex) {
            return promise.reject(ex);
        }
    }
    /**
    * @function
    */
    function startServers(resolve, reject) {
        try {
            var apps = appList, app, cnt = 0;
            lastPort = null; //reset the last port

            //see if we are serving all of the apps with one server, if so we'll create a single app which uses all of the other apps
            if (serverConfig.singleApp && apps.length > 1) {
                app = nodeExpress();
                app.use.apply(
                    null
                    , appList.values()
                );
                apps = {
                    "single": app
                };
            }

            //we'll need to create a server for each app
            Object.keys(apps)
            .forEach(function forEachKey(appKey) {
                cnt++;
                var server = startApp(
                    appKey
                    , apps[appKey]
                    , serverListeningCb
                );
                servers[appKey] = server;
            });

            function serverListeningCb() {
                cnt--;
                if (cnt === 0) {
                    resolve(servers);
                }
            }
        }
        catch(ex) {
            stopServers();
            reject(ex);
        }
    }
    /**
    * @function
    */
    function startApp(appKey, app, serverListeningCb) {
        var config = getAppConfig(appKey)
        , server;

        if (config.secure) {
            server = nodeHttps.createServer(config.options, app);
        }
        else {
            server = nodeHttp.createServer(app);
        }
        //start listening
        server.listen(
            config
            , serverListening
        );

        return server;

        function serverListening() {
            ///LOGGING
            reporter.info(
                infos.application_listening
                , [
                    appKey
                    , !!config.secure
                        ? "securely"
                        : "insecurely"
                    , config.port
                ]
            );
            ///END LOGGING
            serverListeningCb();
        }
    }
    /**
    *
    * @function
    */
    function getAppConfig(appKey) {
        //get the application specific
        var appConfig = serverConfig[appKey] || {};
        //see if there is a port, if not, add one
        if (is_nill(appConfig.port)) {
            //if there isn't a port on the app config, and there isn't a lastPort
            if (is_nill(serverConfig.port) && is_nill(lastPort)) {
                appConfig.port = !!appConfig.secure
                    ? defaults.securePort
                    : defaults.port
                ;
            }
            else {
                //if there is a lastPort
                if (!is_nill(lasPort)) {
                    appConfig.port = ++lasPort;
                }
                else {
                    appConfig.port = lasPort = serverConfig.port;
                }
            }
        }

        return appConfig;
    }
    /**
    * @function
    */
    function stopServers() {
        Object.keys(servers)
        .forEach(function forEachServerKey(serverKey) {
            stopServer(
                serverKey
                , servers[serverKeys]
            );
        });
    }
    /**
    * @function
    */
    function stopServer(serverKey, server) {
        try {
            if (server.listening) {
                ///LOGGING
                reporter.info(
                    infos.server_closing
                    , [serverKey]
                );
                ///END LOGGING
                server.close(function serverClosed() {
                    ///LOGGING
                    reporter.info(
                        infos.server_closed
                        , [serverKey]
                    );
                    ///END LOGGING
                });
            }
        }
        catch(ex) {
            ///LOGGING
            reporter.error(
                error.failed_close_server
                , [serverKey]
            );
            reporter.error(ex);
            ///END LOGGING
        }
    }
}
/**
* The express kit creator uses the @express document annotations to create a hierarchy of apps, params, middleware and routes.
* @factory
*/
function _ExpressKitCreator(
    promise
    , is_array
    , is_object
    , fs_fileInfo
    , workspacePath
    , utils_applyIf
    , defaults
    , errors
) {
    /**
    * @constants
    */
    var cnsts = {
        "expressDocEntryName": "express"
        , "entryKitTypeMap": {
            "app": "apps"
            , "router": "routers"
            , "middleware": "middlewares"
            , "param": "params"
        }
        , "kitEntryDefaults": {
            "app": {
                "path": "/"
                , "params": []
                , "middlewares": []
                , "routers": []
                , "statics": []
            }
            , "router": {
                "methods": ["all"]
                , "path": ["*"]
            }
            , "middleware": {
                "methods": ["use"]
            }
            , "param": {
                "params": []
            }
        }
        , "skipProperties": [
            "indent"
            , "tag"
        ]
    }
    /**
    * @property
    */
    , PARSE_PATT = /^(?:\[[^\]]*\])|(?:\{[^\}]*\})$/
    /**
    * A reg exp pattern for replacing windows path separaters
    * @property
    */
    , SEP_PATT = /[\\]+/g
    ;

    /**
    * @worker
    */
    return function ExpressKitCreator(entry, assets) {
        try {
            //get a list of route asset @express annotations
            var expressDocEntries = getExpressDocEntries(
                entry
                , assets
            )
            //use the annotations to build a kit of apps, routes and middelware
            , kit = createKitObject(
                expressDocEntries
            );

            //verify the kit is complete; app dependencies all exist
            verifyExpressKit(kit);

            return promise.resolve(kit);
        }
        catch(ex) {
            return promise.reject(ex);
        }
    };

    /**
    * Creates an array of express annotations
    * @function
    */
    function getExpressDocEntries(entry, assets) {
        var entries = []
        , routeEntry = entry.config.routeEntry
        , routeEntryRegExp = new RegExp(`${routeEntry}$`);

        assets.forEach(function forEachAsset(asset) {
            //see if this asset is a route
            var isRoute = !!asset.path
                ? routeEntryRegExp.test(asset.path.base)
                : false
            , expressDocEntry;
            //if this is a route then get the express doc entry
            if (isRoute && is_array(asset.docs)) {
                expressDocEntry = getExpressDocEntry(asset.docs);
                if (!!expressDocEntry) {
                    expressDocEntry.depPath =
                        createRelativePath(asset.path.fqpath);
                    expressDocEntry.namespace = asset.naming.namespace;
                    entries.push(expressDocEntry);
                }
            }
        });

        return entries;
    }
    /**
    * @function
    */
    function getExpressDocEntry(docs) {
        var expressDocEntry;

        docs.every(function everyDoc(doc) {
            if (doc.hasOwnProperty(cnsts.expressDocEntryName)) {
                expressDocEntry = createExpressDocEntry(doc);
                return false; //exits the loop
            }
            return true; //continues the loop
        });

        return expressDocEntry;
    }
    /**
    * @function
    */
    function createExpressDocEntry(doc) {
        //get the express doc entry
        var expressDocEntry = doc[cnsts.expressDocEntryName]
        //start a new object to hold the docentry values
        , expressEntry = {};

        //loop through the express doc entry properties and use the property name as the value
        Object.keys(expressDocEntry)
        .filter(function filterDocProps(propKey) {
            return cnsts.skipProperties.indexOf(propKey) === -1;
        })
        .forEach(function forEachProp(propKey) {
            var val = expressDocEntry[propKey];
            if(!!val) {
                val = val.name;
                if (PARSE_PATT.test(val)) {
                    val = JSON.parse(val);
                }
            }
            expressEntry[propKey] = val || "";
        });

        return expressEntry;
    }
    /**
    * @function
    */
    function createKitObject(expressDocEntries) {
        //start the express kit
        var kit = {
            "apps": {}
            , "routers": {}
            , "middlewares": {}
            , "params": {}
        };

        expressDocEntries
        .forEach(function forEachEntry(expDocEntry) {
            addEntryToKit(expDocEntry, kit);
        });

        return kit;
    }
    /**
    * Adds the route entry to the express kit. If it's an app, empty assets that the app point to will be created if they don't exist; for tracking requirements to see if they've been met.
    * @function
    * @sideeffect Updates the express kit
    * @throws duplicate_route_label
    */
    function addEntryToKit(expDocEntry, kit) {
        var name = expDocEntry.name
        , type = expDocEntry.type
        , kitType = cnsts.entryKitTypeMap[type]
        //grab the potential existing entry, a falsey means not exists or it's an app dependency
        , curEntry = kit[kitType]
        , entryPointName;

        ///INPUT VALIDATION
        //ensure we have a name
        if (!name) {
            throw new Error (
                `${errors.route_missing_name} ("${expDocEntry.depPath}")`
            );
        }
        //ensure we have a valid type
        if (!kitType) {
            throw new Error(
                `${errors.invalid_route_type} ("${type}" - "${expDocEntry.depPath}")`
            );
        }
        //ensure we don't have conflicting names
        if (
            !!curEntry
            && curEntry.hasOwnProperty(name)
            && !!curEntry[name]
        ) {
            throw new Error(
                `${errors.duplicate_route_label} ("${type}" - "${name}" - "${expDocEntry.depPath}")`
            );
        }
        ///END INPUT VALIDATION

        //apply any defaults to the express entry
        utils_applyIf(
            cnsts.kitEntryDefaults[type]
            , expDocEntry
        );

        //if it's an app, let's also add any missing middleware and routers, as null values so we can check for missing dependencies
        if (type === "app") {
            //add the app's entrypoint to the begining of the app's middlwares list
            entryPointName = `${name}-entryPoint`;
            expDocEntry.middlewares =
                [entryPointName]
                .concat(expDocEntry.middlewares || []);

            //then add a middleware to the kit
            kit.middlewares[entryPointName] = utils_applyIf(
                cnsts.kitEntryDefaults.middleware
                , {
                    "namespace": expDocEntry.namespace
                    , "name": entryPointName
                }
            );

            //ensure the middlware entries all exist
            processAppDependencies(
                "middlewares"
                , expDocEntry
                , kit
            );
            //if there is a list of routers, ensure they exist
            if (!!expDocEntry.routers) {
                processAppDependencies(
                    "routers"
                    , expDocEntry
                    , kit
                );
            }
            //if there is a list of params, then ensure they exist
            if (!!expDocEntry.params) {
                processAppDependencies(
                    "params"
                    , expDocEntry
                    , kit
                );
            }
        }

        //add the entry to the kit
        kit[kitType][name] = expDocEntry;
    }
    /**
    * @function
    */
    function processAppDependencies(key, expDocEntry, kit) {
        //convert the middleware to an array
        if (!is_array(expDocEntry[key])) {
            expDocEntry[key] = [expDocEntry[key]];
        }
        //loop through the middleware entries and add dummy records if the name doesn't already exist on the kit
        expDocEntry[key]
        .forEach(function forEachName(name) {
            if(is_object(name)) {
                name = name.name;
            }
            if (!kit[key].hasOwnProperty(name)) {
                kit[key][name] = null;
            }
        });
    }
    /**
    * Inspects the kit to verify that all params, routers and middleware, required by the apps, are present
    * @function
    */
    function verifyExpressKit(kit) {
        //check the routers
        var missing
        , kitRouterKeys = Object.keys(kit.routers)
        , routersPass =
            kitRouterKeys
            .every(function everyRouter(router, indx) {
                if (!router) {
                    missing = kitRouterKeys[indx];
                    return false;
                }
                return true;
            });
        //see if we found null entries
        if (!routersPass) {
            throw new Error(
                `${errors.missing_router_middleware} (router "${missing}")`
            );
        }

        //check the middleware
        var kitMiddlewareKeys = Object.keys(kit.middlewares)
        , middlewarePass =
            kitMiddlewareKeys
            .every(function everyMiddleware(middleware, indx) {
                if (!middleware) {
                    missing = kitMiddlewareKeys[indx];
                    return false;
                }
                return true;
            });
        //see if we found null entries
        if (!middlewarePass) {
            throw new Error(
                `${errors.missing_router_middleware} (middleware "${missing}")`
            );
        }

        //check the middleware
        var kitParamsKeys = Object.keys(kit.params)
        , paramsPass =
            kitParamsKeys
            .every(function everyMiddleware(param, indx) {
                if (!param) {
                    missing = kitParamsKeys[indx];
                    return false;
                }
                return true;
            });
        //see if we found null entries
        if (!paramsPass) {
            throw new Error(
                `${errors.missing_router_middleware} (param "${missing}")`
            );
        }
    }
    /**
    * Removes the workspace path from the fq path
    * @function
    */
    function createRelativePath(fqpath) {
        return fqpath
            .replace(workspacePath, "")
            .replace(defaults.sourceDirectory, "")
            .replace(SEP_PATT, "/");
    }
}
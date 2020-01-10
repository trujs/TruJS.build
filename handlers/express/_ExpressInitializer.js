/**
* @factory
*/
function _ExpressInitializer(
    promise
    , is_array
    , buildHandlers_ioc_monolith_initialize
    , buildHelpers_express_dependencies
    , utils_merge
    , defaults
    , errors
) {
    /**
    * @alias
    */
    var moduleInitializer = buildHandlers_ioc_monolith_initialize
    /**
    * @alias
    */
    , dependencies = buildHelpers_express_dependencies
    ;

    /**
    * @worker
    */
    return function ExpressInitializer(
        entry
        , assets
        , processDetail
    ) {
        //add the route wildcard entry to the
        return addRouteEntry(
            entry
        )
        //then add some local depenedncy tree entries
        .then(function thenAddLocalDtree() {
            return addRouteDependencies(
                entry
            );
        })
        //then run the module initializer
        .then(function thenModuleInitializer() {
            return moduleInitializer(
                entry
                , assets
                , processDetail
            );
        });
    };

    /**
    * @function
    */
    function addRouteEntry(entry) {
        try {
            ///INPUT VALIDATION
            //add the files entry if one doesn't exist
            if (!entry.hasOwnProperty(defaults.pathsPropertyName)) {
                entry[defaults.pathsPropertyName] = [];
            }
            //if the files entry is not an array
            if (!is_array(entry[defaults.pathsPropertyName])) {
                throw new Error(
                    `${errors.invalid_paths_property} (${typeof entry[defaults.pathsPropertyName]})`
                );
            }
            ///END INPUT VALIDATION

            //see if there is an entry with route.js in it
            if (!hasRouteEntry(entry)) {
                entry[defaults.pathsPropertyName]
                .push(
                    `[r]./*${entry.config.routeEntry}`
                );
            }

            return promise.resolve();
        }
        catch(ex) {
            return promise.reject(ex);
        }
    }
    /**
    * @function
    */
    function hasRouteEntry(entry) {
        var notFound = entry.paths
            .every(function everyPath(path) {
                if (path.indexOf(entry.config.routeEntry) !== -1) {
                    return false;
                }
                return true;
            });
        return !notFound;
    }
    /**
    * @function
    */
    function addRouteDependencies(entry) {
        try {
            entry[defaults.localDepTreePropertyName] =
                utils_merge(
                    entry[defaults.localDepTreePropertyName]
                    , dependencies
                );

            return promise.resolve();
        }
        catch(ex) {
            return promise.reject(ex);
        }
    }
}
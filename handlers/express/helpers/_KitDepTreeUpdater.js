/**
* The Kit - Dependency Tree - Updater adds a `$route$` branch to the dependnecy tree with the apps, routers and middleware in the express kit
* @factory
*/
function _KitDepTreeUpdater(
    promise
    , defaults
    , is_object
    , errors
) {

    /**
    * @worker
    */
    return function KitDepTreeUpdater(entry, kit, kitPath) {
        //create the branch that will hold the route dependencies
        return addRouteBranch(
            entry
            , kit
            , kitPath
        )
        //then add the branch to the dtree
        .then(function thenAddBranch(routeBranch) {
            //add the route entry to the dtree
            entry.dtree[defaults.routeBranchName] = [routeBranch];

            return promise.resolve();
        });
    };

    /**
    * @function
    */
    function addRouteBranch(entry, kit, kitPath) {
        try {
            //start the route branch
            var branch = {
                "routeKit": [`:${kitPath}`]
                , "handlers": [{
                    "apps": [{}]
                    , "routers": [{}]
                    , "middlewares": [{}]
                    , "params": [{}]
                }]
            }
            , handlers = branch.handlers[0]
            , curRouteBranch = entry.dtree[defaults.routeBranchName];

            //if there's already a route branch then apply it first
            if (!!curRouteBranch) {
                Object.keys(curRouteBranch[0])
                .forEach(function forEachKey(key) {
                    if (!branch.hasOwnProperty(key)) {
                        branch[key] = curRouteBranch[0][key];
                    }
                    else if (key !== "config") {
                        utils_apply(
                            curRouteBranch[0][key][0]
                            , branch[key][0]
                        );
                    }
                });
            }

            //loop through the properties in the kit
            Object.keys(kit)
            .forEach(function forEachProp(propName) {
                //loop through the properties for this prop on the kit
                Object.keys(kit[propName])
                .forEach(function forEachKitKey(key) {
                    var name = is_object(key)
                        ? key.name
                        : key
                    , item = kit[propName][name];
                    //
                    if (!item) {
                        throw new Error(
                            `${errors.missing_required_dependency} (${propName}, ${name})`
                        );
                    }
                    //create an entry on the prop branch
                    handlers[propName][0][name] = [`:${item.namespace}`,[]];
                });
            });

            return promise.resolve(branch);
        }
        catch(ex) {
            return promise.reject(ex);
        }
    }
}
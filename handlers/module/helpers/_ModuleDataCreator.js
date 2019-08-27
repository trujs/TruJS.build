/**
* The module data creator turns the array of assets into an array of dependency entries; root namespace declared with var, assignment statements and namespace aliasing
* @factory
*/
function _ModuleDataCreator(
    buildHelpers_trujs_module_namespaceDataCreator
    , buildHelpers_trujs_module_aliasDataCreator
    , utils_lookup
    , utils_copy
    , errors
) {
    /**
    * @alias
    */
    var namespaceDataCreator = buildHelpers_trujs_module_namespaceDataCreator
    /**
    * @alias
    */
    , aliasDataCreator = buildHelpers_trujs_module_aliasDataCreator
    /**
    * A reg exp pattern for splitting namespaces
    * @property
    */
    , NS_SPLIT_PATT = /[.]/g
    ;

    /**
    * @worker
    */
    return function ModuleDataCreator(assets) {
        //generate a collection of namespaces
        var namespaces = createNamespaceCollection(
            assets
        )
        //get a list of any missing root and parent namespaces
        , namespaceAdditions = getMissingNamespaces(
            namespaces
        )
        //combine the namespace collection and additions
        , allNamespaces = combineNamespaces(
            namespaces
            , namespaceAdditions
        )
        //create the dependency entries for the namespaces
        , namespaceData = namespaceDataCreator(
            allNamespaces
        )
        //create the alias entries
        , aliasData = aliasDataCreator(
            assets
        );
        //combine the namespace and alias data
        return namespaceData.concat(aliasData);
    };

    /**
    * Generates a collection of namespaces and their values
    * @function
    */
    function createNamespaceCollection(assets) {
        var namespaces = {}
        , duplicates = [];

        assets.forEach(function forEachAsset(asset) {
            var namespace = asset.naming.namespace;

            if (namespaces.hasOwnProperty(namespace)) {
                duplicates.push(
                    namespace
                );
            }
            else {
                namespaces[namespace] = asset;
            }
        });

        if (duplicates.length > 0) {
            throw new Error(
                `${errors.duplicate_namespace} (${duplicates})`
            );
        }

        return namespaces;
    }
    /**
    * Loops through the namespace collection and fills in any namespace gaps; i.e. if `TruJS.module._ModuleDataCreator` is in the list, we'd add `TruJS` and `TruJS.module`.
    * @function
    */
    function getMissingNamespaces(namespaces) {
        var nsKeys = Object.keys(namespaces)
        , additions = [];

        nsKeys
        .forEach(function forEachNs(namespace) {
            var name = ""
            //get an array of namespace segments, and remove the last one
            , nsSegs = namespace.split(NS_SPLIT_PATT);
            nsSegs.pop();
            //loop through the remaining segments, adding each subsequent segment to the name
            for(var si = 0, len = nsSegs.length; si < len; si++) {
                if (!name) {
                    name = nsSegs[si];
                }
                else {
                    name+= `.${nsSegs[si]}`;
                }
                if (nsKeys.indexOf(name) === -1) {
                    if (additions.indexOf(name) === -1) {
                        additions.push(name);
                    }
                }
            }
        });

        return additions;
    }
    /**
    * Combines the namespace collection and namespaceAdditions array
    * @function
    */
    function combineNamespaces(namespaces, namespaceAdditions) {
        var allNamespaces = {};

        //add the root and parent namespaces first
        namespaceAdditions
        .forEach(function forEachAddition(addition) {
            allNamespaces[addition] = null;
        });

        //add the namespaces
        Object.keys(namespaces)
        .forEach(function forEachNsKey(nsKey) {
            allNamespaces[nsKey] = namespaces[nsKey];
        });

        return allNamespaces;
    }
}
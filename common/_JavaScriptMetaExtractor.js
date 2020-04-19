/**
* @factory
*/
function _JavaScriptMetaExtractor(
    utils_func_inspector
    , utils_apply
    , utils_applyIf
    , is_array
    , is_empty
    , errors
) {

    /**
    * @worker
    *   @param {object} asset A single javascript asset
    */
    return function JavaScriptMetaExtractor(asset) {
        var factoryEntryMeta = getFactoryEntryMetaData(
            asset
        )
        , docMeta = getDocMetaData(
            asset
        )
        , fnMeta = getFunctionMeta(
            asset
        )
        , meta = {};

        //use the doc and function meta to create the initial meta data object
        utils_apply(docMeta, meta);
        utils_applyIf(fnMeta, meta);
        utils_apply(factoryEntryMeta, meta);

        return meta;
    };

    /**
    * If there are "entries" on the asset, they are from the IOC and will be processed and added to the meta for downstream evaluation
    * @function
    */
    function getFactoryEntryMetaData(asset) {
        //skip if there aren't any entries
        if (!asset.entries) {
            return {};
        }

        var factoryEntryMeta = {
            "overrideArguments": []
            , "isFactory": false
        };

        //look through each factory entry, as each might have alternate argument dependencies
        asset.entries
        .forEach(function forEachEntry(entry) {
            //skip if this isn't a factory
            if (entry.type !== "factory") {
                return;
            }
            //set that this is a factory
            factoryEntryMeta.isFactory = true;
            //loop through the dependencies
            entry.dependencies
            .forEach(function forEachDep(dep, indx) {
                if (dep !== "\b") {
                    factoryEntryMeta.overrideArguments[indx] = dep;
                }
            })
        });

        return factoryEntryMeta;
    }
    /**
    * Uses the documentation annotations to determine if this asset is a factory and what it's dependencies are
    * @function
    */
    function getDocMetaData(asset) {
        if (!asset.docs) {
            return;
        }
        var meta = {
            "isFactory": false
        };
        //loop through the documentation
        asset.docs
        .forEach(function forEachDoc(doc) {
            if (doc.factory) {
                meta.isFactory = true;
                if (!!doc.factory.dependency) {
                    meta.dependencies = createDTree(
                        asset.path.fqpath
                        , doc.factory.dependency
                    );
                }
                //TODO: add the other factory properties
            }
        });

        return meta;
    }
    /**
    * Uses the factory dependency annotations to build a dtree for the asset
    * @function
    */
    function createDTree(path, dependencyDocs) {
        var dTree = {};

        //ensure dependencyDocs an array
        if(!is_array(dependencyDocs)) {
            dependencyDocs = [dependencyDocs];
        }
        //loop throught the dependencies
        dependencyDocs
        .forEach(function forEachDep(dep) {
            var abstractPath = dep.name
            , dependency = dep.desc;
            //parse the dependency so it becomes dependency notation
            try {
                dependency = JSON.parse(dependency);
            }
            catch(ex) {
                //the dependency is not in the correct format
                throw new Error(
                    `${errors.invalid_dependency_annotation} ("${path}")`
                );
            }

            dTree[abstractPath] = dependency;
        });

        return dTree;
    }
    /**
    * Extracts the function arguments and changes them to dot notation paths to abstract namespaces
    * @function
    */
    function getFunctionMeta(asset) {
        //get the function's meta data
        var funcMeta = utils_func_inspector(
            asset.data
            , true
        )
        , meta = {
            "isFactory": false
        };

        if (!!funcMeta) {
            if (funcMeta.name[0] === "_") {
                meta.isFactory = true;
            }
            meta.arguments = funcMeta.params;
            meta.argumentDefaults = funcMeta.defaults;
            meta.name = funcMeta.name;
        }

        return meta;
    }
}
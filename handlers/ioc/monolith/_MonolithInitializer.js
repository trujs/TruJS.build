/**
* @factory
*/
function _MonolithInitializer(
    promise
    , buildHelpers_ioc_dependencyTreeGenerator
    , buildHelpers_ioc_assetPathListGenerator
    , defaults
) {
    /**
    * @alias
    */
    var dependencyTreeGenerator = buildHelpers_ioc_dependencyTreeGenerator
    /**
    * @alias
    */
    , assetPathListGenerator = buildHelpers_ioc_assetPathListGenerator
    ;

    /**
    * @worker
    */
    return function MonolithInitializer(
        entry
    ) {
        //generate the complete dependency tree
        return dependencyTreeGenerator(
            entry
        )
        //use the dependency tree to generate the list of dependency paths
        .then(function thenCreatePathList(dtree) {
            return assetPathListGenerator(
                entry
                , dtree
            );
        })
        //then use the dependency paths to update the manifest entry paths
        .then(function thenUpdateManifestFiles(paths) {
            return addEntryPaths(
                entry
                , paths
            );
        });
    };

    /**
    * Inserts the generated file paths into the file property on the manifest entry
    * @function
    */
    function addEntryPaths(entry, pathObjs) {
        try {
            //turn the paths into string file paths
            var paths = getfilePaths(pathObjs);
            //if there isn't a files property, add one
            if (!entry.hasOwnProperty(defaults.pathsPropertyName)) {
                entry[defaults.pathsPropertyName] = paths;
            }
            //otherwise concat the 2 arrays
            else {
                entry[defaults.pathsPropertyName] =
                    paths.concat(entry[defaults.pathsPropertyName]);
            }
            //add the paths to the entry
            entry.dtreeEntries = pathObjs;

            return promise.resolve();
        }
        catch(ex) {
            return promise.reject(ex);
        }
    }
    /**
    * Generates a list of file paths from the asset path objects
    * @function
    */
    function getfilePaths(paths) {
        return paths.map(function mapPaths(pathObj) {
            return pathObj.path;
        });
    }
}
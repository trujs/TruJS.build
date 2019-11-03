/**
*
* @factory
*/
function _FileCollector(
    promise
    , buildHelpers_file_filePathProcessor
    , buildHelpers_file_multiPathLoader
    , buildHelpers_file_pathListFilter
    , buildHelpers_file_checkoutRepositories
    , buildHelpers_pathParser
    , is_object
    , is_array
    , reporter
    , defaults
    , errors
) {
    /**
    * @alias
    */
    var filePathProcessor = buildHelpers_file_filePathProcessor
    /**
    * @alias
    */
    , multiPathLoader = buildHelpers_file_multiPathLoader
    /**
    * @alias
    */
    , pathListFilter = buildHelpers_file_pathListFilter
    /**
    * @alias
    */
    , checkoutRepositories = buildHelpers_file_checkoutRepositories
    /**
    * @alias
    */
    , pathParser = buildHelpers_pathParser
    ;

    /**
    * @worker
    *   @async
    */
    return function FileCollector(
        entry
        , assets
        , procDetail
    ) {
        var  proc = promise.resolve();

        //checkout any required repositories
        if (entry.config.checkout === "true") {
            proc = checkoutRepositories(
                entry
                , procDetail
            );
        }

        //then run the file path processor for each member of the files array
        return proc
        .then(function thenProcessPaths() {
            return processFilePaths(
                entry
            );
        })
        //then filter the array of path arrays based on the fragment and/or modifier
        .then(function thenFilterPathList(paths) {
            if (paths.length === 0) {
                return promise.resolve(paths);
            }
            //add the exclusions from the config
            addPathExclusions(
                paths
                , entry.config
            );
            //filter the paths
            return pathListFilter (
                paths
            );
        })
        //load the files
        .then(function thenLoadFiles(paths) {
            if (!paths) {
                return promise.resolve([]);
            }
            return multiPathLoader(
                paths
                , procDetail
            );
        });
    };

    /**
    * Creates an array of promises, each of which executes the file path processor for a path in the files array from the manifest entry
    * @function
    */
    function processFilePaths(entry) {
        var files = entry[defaults.pathsPropertyName], procs = [];

        if (!Array.isArray(files)) {
            if (!is_object(entry.include)) {
                return promise.reject(
                    new Error(
                        `${errors.missing_files_property} (${entry.type})`
                    )
                );
            }
            return promise.resolve([]);
        }

        //create a promise group to run concurrently
        files.forEach(function forEachPath(path) {
            procs.push(
                filePathProcessor(
                    path
                    , entry.config.project
                )
            );
        });

        return Promise.all(procs);
    }
    /**
    * Adds the path exclusions to the paths array
    * @function
    */
    function addPathExclusions(paths, config) {
        if (is_array(config.excludePaths)) {
            config.excludePaths
            .forEach(function forEachExclude(path) {
                var pathFrag = pathParser(path);
                pathFrag.minus = true;
                paths.push(
                    {
                        "path": pathFrag
                    }
                );
            });
        }
    }
}
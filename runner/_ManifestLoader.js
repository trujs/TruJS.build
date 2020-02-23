/**
* The manifest loader loads the initial manifest path, and any nested manifest paths.
* @factory
* @interface iManifestEntry
*
*/
function _ManifestLoader(
    promise
    , fs_fileLoader
    , workspacePath
    , manifestInit
    , node_path
    , is
    , utils_merge
    , utils_copy
    , defaults
) {
    /**
    * A regular expression pattern to see if there are any string paths in the entries array
    * @property
    */
    var OBJ_ONLY_ENTRY_PATT =/^(?:\[object Object\])+$/
    /**
    * A regular expression pattern for matching project paths
    * @property
    */
    , PROJ_PATH_PATT = /^\{([A-z0-9_\.]+)\}(.+)$/
    /**
    * A regular expression for replacing dots
    * @property
    */
    , DOT_PATT = /[\.]/g
    ;

    /**
    * @worker
    */
    return function ManifestLoader(
        manPathStr
        , basePathStr
        , parentManifest
    ) {
        //load the initial manifest path
        return loadPath(
            manPathStr
            , basePathStr
        )
        //then process the manifest entries, loading any string paths
        .then(function thenProcessManifest(manifest) {
            return processManifest(
                manifest
                , basePathStr
            )
        })
        //then init the manifest
        .then(function thenInitManifest(manifest) {
            try {
                var entries = manifestInit(
                    manifest
                );

                return promise.resolve(entries);
            }
            catch(ex) {
                return promise.reject(ex);
            }
        });
    };

    /**
    * Checks a single manifest object for any string entries and loads each string as a manifest path, recursively.
    * @function
    */
    function processManifest(manifest, basePathStr) {
        try {
            var entries = manifest[defaults.manifestEntriesPropertyName];
            //if there aren't any entries, or the array is empty nothin to do
            if (is.nill(entries) || !is.array(entries) || is.empty(entries)) {
                return promise.resolve(manifest);
            }
            //if the entries array is only objects then nothin to do
            if (entries.join("").match(OBJ_ONLY_ENTRY_PATT)) {
                return promise.resolve(manifest);
            }
            //create an array of manifest path loading procs and their keys
            return loadManifestPathEntries(
                entries
                , basePathStr
            )
            .then(function thenReturnManifest(loadedMAnifests) {
                return promise.resolve(manifest);
            });
        }
        catch(ex) {
            return promise.reject(ex);
        }
    }
    /**.
    * @function
    */
    function loadManifestPathEntries(entries, basePathStr) {
        var loadProcs = [];

        //loop through the manifest entries and load each string path
        entries.forEach(function forEachEntry(entry, index) {
            if (is.string(entry)) {
                //start the loading process
                var loadProc = loadPath(
                    entry
                    , basePathStr
                )
                //then create a loaded manifest entry
                .then(function thenReturnLoaded(loadedManifest) {
                    entries[index] = loadedManifest;
                    return processManifest(
                        loadedManifest
                        , basePathStr
                    );
                });
                //add the path loader to the procs array
                loadProcs.push(
                    loadProc
                );
            }
        });

        return promise.all(
            loadProcs
        );
    }
    /**
    * load the path and then parse the data into JSON
    * @function
    */
    function loadPath(pathStr, basePathStr) {
        var path = pathStr
        , match;
        //if the path begins with a dot, it's relitive to the current project
        if (pathStr[0] === ".") {
            path = node_path.join(
                basePathStr
                , pathStr.substring(1)
            );
        }
        //otherwise, if the path has a project path in it, create the project path
        else if ((match = pathStr.match(PROJ_PATH_PATT))) {
            path = node_path.join(
                workspacePath
                , defaults.sourceDirectory
                , match[1].replace(DOT_PATT, "/")
                , match[2]
            );
        }

        return fs_fileLoader(
            path
        )
        .then(function thenParseData(data) {
            return parseData(data);
        });
    }
    /**
    * Async JSON parse
    * @function
    */
    function parseData(data) {
        try {
            return promise.resolve(
                JSON.parse(data)
            );
        }
        catch(ex) {
            return promise.reject(ex);
        }
    }
}
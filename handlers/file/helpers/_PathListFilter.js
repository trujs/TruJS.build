/**
*
* @factory
*/
function _PathListFilter(
    promise
    , is
    , utils_regex
    , nodePath
    , defaults
    , errors
) {
    /**
    * A regular expression pattern for finding path seperators
    * @property
    */
    var SEP_PATT = /[\\\/]/g
    /**
    * A regexp pattern for finding characters that need escaping
    * @property
    */
    , ESCP_PATT = /[\\\/\.\:]/g
    /**
    * A regular expression pattern for identifying the reg exp in path segments
    * @property
    */
    , REG_PATT = /<((?:[^>]|(?:(?<=[\\])[>]))+)>/g
    /**
    * A regular expression pattern to look for asterisks
    * @property
    */
    , ASTR_PATT = /[*]/;

    /**
    * @worker
    *   @async
    */
    return function PathListFilter(pathsAr) {
        //for each array of paths, use the fragment to filter the children
        return processPaths(
            pathsAr
        )
        //then combine the children
        .then(function thenCombineChildren(resultsAr) {
            return combineChildren(resultsAr);
        })
        //then remove any minus matches
        .then(function thenFilterPaths(paths) {
            return filterPaths(paths);
        })
        //then parse the path
        .then(function thenParsePaths(paths) {
            return parsePaths(paths);
        });
    };

    /**
    * Loops through the array of paths and start a promise for each
    * @function
    */
    function processPaths(paths) {
        ///INPUT VALIDATION
        if (!is.array(paths)) {
            return promise.reject(
                new Error(
                    `${errors.invalid_path_list} (${typeof paths})`
                )
            );
        }
        ///END INPUT VALIDATION

        //create an array of promises for processing the paths
        var procs = [];

        paths.forEach(function forEachPath(pathInfo) {
            procs.push(new promise(
                processPath.bind(null, pathInfo)
            ));
        });

        return promise.all(procs);
    }
    /**
    * Uses the fragment to filter the list of child paths
    * @function
    */
    function processPath(pathInfo, resolve, reject) {
        try {
            var pathList = [];

            //if the path fragment is a minus, send the match path regexp
            if (pathInfo.path.minus) {
                resolve([pathInfo.path.matchPath]);
                return;
            }
            //if the path is a containr without children, return nothin
            if (
                pathInfo.isContainer
                && pathInfo.children.length === 0
            ) {
                resolve([]);
                return;
            }
            //if this is not a container then return the path
            if (!pathInfo.isContainer) {
                resolve([pathInfo.path.fqpath]);
                return;
            }

            //loop through the children
            pathInfo.children
            .forEach(function forEachChildPath(childPath) {
                //see if the child path matches the path fragment
                if (testChild(pathInfo, childPath)) {
                    //add the path to the list
                    pathList.push(
                        childPath
                    );
                }
            });

            resolve(pathList);
        }
        catch(ex) {
            reject(ex);
        }
    }
    /**
    * Test the childpath to see if it fits the path info
    * @function
    */
    function testChild(pathInfo, childPath) {
        var testPath = pathInfo.path
        , updPath = childPath.replace(SEP_PATT, "/")
        ;

        if (testPath.matchPath.test(updPath)) {
            return true;
        }
        return false;
    }
    /**
    * Combines the array or path arrays into a single array of paths
    * @function
    */
    function combineChildren(resultsAr) {
        try {
            var pathList = [];

            //loop through the array of path arrays
            resultsAr.forEach(function forEachPathAr(pathAr) {

                //loop through the path array
                pathAr.forEach(function forEachPath(path) {
                    pathList.push(path);
                });

            });

            return promise.resolve(pathList);
        }
        catch(ex) {
            return promise.reject(ex);
        }
    }
    /**
    * @function
    */
    function filterPaths(paths) {
        try {
            var pathList = [];

            //loop through the paths
            paths.forEach(function forEachPath(path) {
                //and if it's a string then add it
                if (typeof path === "string") {
                    //but only if it doesn't exist, making it distinct
                    if (pathList.indexOf(path) === -1) {
                        pathList.push(path);
                    }
                }
                //otherwise we're assuming it's regex, which means it's a minus
                else {
                    pathList = removeMinusPath(
                        pathList
                        , path
                    );
                }
            });

            return promise.resolve(pathList);

        }
        catch (ex) {
            return promise.reject(ex);
        }
    }
    /**
    * @function
    */
    function removeMinusPath(pathList, minus) {
        var newList = [];

        pathList.forEach(function forEachPath(path) {
            if (!path.match(minus)) {
                newList.push(path);
            }
        });

        return newList;
    }
    /**
    * @function
    */
    function parsePaths(paths) {
        try {
            var pathObjs = [];

            paths.forEach(function forEachPath(path) {
                var pathObj = nodePath.parse(path);
                pathObj.fqpath = path;
                pathObjs.push(
                    pathObj
                );
            });

            return  promise.resolve(pathObjs);
        }
        catch(ex) {
            return promise.reject(ex);
        }
    }
}
/**
*
* @factory
*/
function _PathListFilter(
    promise
    , is
    , utils_regex
    , buildHelpers_pathParser
    , defaults
    , errors
) {
    /**
    * A regular expression pattern for finding path separaters
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
    , ASTR_PATT = /[*]/
    /**
    * @alias
    */
    , pathParser = buildHelpers_pathParser
    ;

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
        });
    };

    /**
    * Loops through the array of paths and start a promise to process each path
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
                resolve([pathInfo.path]);
                return;
            }
            //if the path is a container without children, return nothin
            if (
                pathInfo.isContainer
                && pathInfo.children.length === 0
            ) {
                resolve([]);
                return;
            }
            //if this is not a container then return the path object
            if (!pathInfo.isContainer) {
                resolve([pathInfo.path]);
                return;
            }

            //loop through the children
            pathInfo.children
            .forEach(function forEachChildPath(childPath) {
                //see if the child path matches the path fragment
                if (testChild(pathInfo, childPath)) {
                    var pathObj = pathParser(
                        childPath
                    );
                    //if the parent has a newPath property, add it to the path
                    if (!!pathInfo.newPath) {
                        pathObj.newPath = athInfo.newPath;
                    }
                    //add the path to the list
                    pathList.push(
                        pathObj
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
            paths.forEach(function forEachPath(pathObj) {
                //if regex, it's a minus, filter the current pathlist
                if (pathObj.minus) {
                    pathList = removeMinusPath(
                        pathList
                        , pathObj
                    );
                }
                //otherwise this is a path to add to the list
                else {
                    //but only if it doesn't already exist
                    if (!hasPath(pathObj, pathList)) {
                        pathList.push(pathObj);
                    }
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
    function removeMinusPath(pathList, removePathObj) {
        var newList = [];

        pathList.forEach(function forEachPath(pathObj) {
            var path = pathObj.fqpath;
            if (!path.match(removePathObj.minus)) {
                newList.push(pathObj);
            }
        });

        return newList;
    }
    /**
    * @function
    */
    function hasPath(pathObj, pathList) {
        return !pathList.every(function everyPath(existingPath) {
            //if the fqpath matches we pass level 1
            if (pathObj.fqpath === existingPath.fqpath) {
                //if the newPath property is the same, this is a match
                if (pathObj.newPath === existingPath.newPath) {
                    return false;
                }
            }
            //continue looping
            return true;
        });
    }
}
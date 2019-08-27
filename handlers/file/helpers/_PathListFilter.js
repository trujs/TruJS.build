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
    * A regular expression pattern for splitting paths
    * @property
    */
    var SPLIT_PATT = /[\\\/]/g
    /**
    * A regular expression pattern for identifying the reg exp in path segments
    * @property
    */
    , REG_PATT = /(?:\[([^\]]+)\])|([.])/g
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
        .then(function thenRemoveMinusPaths(paths) {
            return removeMinusPaths(paths);
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

            if (!pathInfo.hasOwnProperty("children")) {
                resolve([pathInfo.path.fqpath]);
                return;
            }

            //loop through the children
            pathInfo.children
            .forEach(function forEachChildPath(childPath) {

                //see if the child path matches the path fragment
                if (testChild(pathInfo, childPath)) {
                    //add minus sign
                    if (pathInfo.path.modifier.indexOf("-") !== -1) {
                        childPath = `-${childPath}`;
                    }
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
        var childSegs = childPath.split(SPLIT_PATT)
        , path = pathInfo.path
        , isRecursive = path.modifier.indexOf("r") !== -1
        , pathSegs = pathInfo.path.segments
        , pathSegsLastIndx = pathSegs.length - 1;

        //loop throught the child segments and see if they match the path
        return childSegs.every(function everyChildSeg(childSeg, indx) {
            //if this index is greater than the last path index we are at the end of the path segments
            if (pathSegsLastIndx < indx) {
                //if this is recursive then we're good to go
                if (isRecursive) {
                    //we'll just accept all of the segments from here on
                    return true;
                }
                return false;
            }

            var pathSeg = pathSegs[indx];

            //update any wild cards
            pathSeg = pathSeg.replace(
                ASTR_PATT
                , function replaceAStr() {
                    return "[.+]";
                }
            );

            //see if the path segment is reg ex
            if (REG_PATT.test(pathSeg)) {
                return testSeg(pathSeg, childSeg);
            }
            else if (pathSeg === childSeg) {
                return true;
            }

            return false;
        });
    }
    /**
    * Matches the child segment to the path segment, processing any regexp patterns
    * @function
    */
    function testSeg(pathSeg, childSeg) {
        var fullRegExpStr = pathSeg.replace(
            REG_PATT
            , function replaceReg(str, patt) {
                if (!patt) {
                    return "[.]";
                }
                return patt;
            }
        )
        , regexp = new RegExp(fullRegExpStr);

        return regexp.test(childSeg);
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
    function removeMinusPaths(paths) {
        try {
            var pathList = [];

            //add the paths to the path list until the minus entries are found
            paths.forEach(function forEachPath(path) {
                if (path[0] === "-") {
                    pathList.splice(
                        pathList.indexOf(
                            path.substring(1)
                        )
                        , 1
                    );
                }
                else {
                    pathList.push(path);
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
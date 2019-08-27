/**
*
* @interface iFileData
*   @property {iPathInfo} path
*   @property {string} encoding
*   @property {any} data
*   @property {error} err
* @factory
*/
function _MultiPathLoader(
    promise
    , nodePath
    , fs_fileLoader
    , reporter
    , defaults
    , errors
) {
    /**
    * @constants
    */
    var cnsts = {
        "fallbackEncoding": "utf8"
    };

    /**
    * @worker
    *   @async
    */
    return function MultiPathLoader(
        paths
        , procDetail
    ) {
        ///LOGGING
        reporter.info(
            `Begin loading ${paths.length} files`
            , procDetail
        );
        ///END LOGGING
        //load the files for each path
        return loadPaths(
            paths
        )
        //then identify failures
        .then(function thenFindErrors(files) {
            var failedPaths = getFailedPaths(files);
            if (failedPaths.length > 0) {
                return promise.reject (
                    `${errors.file_path_load} (${failedPaths.join(",")})`
                );
            }
            ///LOGGING
            reporter.info(
                `Completed loading files`
                , procDetail
            );
            ///END LOGGING
            return promise.resolve(files);
        });
    };

    /**
    * Loops through the paths and creates a promise for each
    * @function
    */
    function loadPaths(paths) {
        var procs = [];
        try {
            paths.forEach(function forEachPath(path) {
                procs.push(
                    loadPath(path)
                );
            });

            return promise.all(procs);
        }
        catch(ex) {
            return promise.reject(ex);
        }
    }
    /**
    * Runs the loader for the path and swallows exceptions, returning them in place of the file data
    * @function
    */
    function loadPath(pathObj) {
        var ext = pathObj.ext
        , encoding = defaults.fileExtEncodingMap[ext]
            || defaults.fileExtEncodingMap.$default
            || cnsts.fallbackEncoding
        , fileData = {
            "path": pathObj
            , "encoding": encoding
        };

        return fs_fileLoader(
            pathObj.fqpath
            , encoding
        )
        .then(function thenCreateFileData(data) {
            fileData.data = data;
            return promise.resolve(
                fileData
            );
        })
        .catch(function catchSwallowError(err) {
            fileData.err = errors[err.code];
            return promise.resolve(
                fileData
            );
        });
    }
    /**
    * Looks for errors in each file object
    * @function
    */
    function getFailedPaths(files) {
        return files.filter(function filterErr(fileObj) {
            if (!!fileObj.err) {
                return true;
            }
            return false;
        })
        .map(function mapErr(fileObj) {
            return fileObj.path.fqpath;
        });
    }

}
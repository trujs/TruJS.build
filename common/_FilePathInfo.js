/**
* The file path info utility uses the file path info to build a list of files that the path points to.
* @interface iPathInfo
*   @property {iPathFragment} path
*   @property {boolean} missing True when the target of the path, without the fragment, was not found
*   @property {boolean} isContainer True if the path is a directory
*   @property {array} children A list of string paths that are in the container
* @factory
*/
function _FilePathInfo(
    promise
    , fs_filePathInfo
    , is
) {

    /**
    * @worker
    *   @param {iPathFragment} pathFrag
    */
    return function FilePathInfo(pathFrag) {
        return getFilePathInfo(pathFrag);
    };

    /**
    * @function
    */
    function getFilePathInfo(pathFrag) {
        //get the path to use for the meta lookup
        var path = pathFrag.fqpath
        , options = {
            "recurse": false
            , "filter": pathFrag.filter
        }
        , proc;
        //if there is a recursive modifier or a fragment use the dir property
        if (
            !!pathFrag.fragment
            || pathFrag.modifier.indexOf("r") !== -1
        ) {
            path = pathFrag.dir;
            options.recurse = true;
        }
        //add the file extension filter
        if (
            !!pathFrag.ext
            && pathFrag.ext !== "*"
        ) {
            options.filter = [pathFrag.ext];
        }
        //skip looking up the path info if this is a minus
        if (pathFrag.modifier.indexOf("-") === -1) {
            //get the file path info for the path
            proc = fs_filePathInfo(
                path
                , options
            );
        }
        else {
            proc = promise.resolve();
        }

        return proc
        //then create the instance of iPathInfo
        .then(function thenCreatePathInfo(fileInfo) {
            return createPathInfo(
                fileInfo
                , pathFrag
            );
        });
    }
    /**
    * @function
    */
    function createPathInfo(fileInfo, pathFrag) {
        var pathInfo = {
            "path": pathFrag
        };

        //if its an error then it doesn't exist
        if (is.error(fileInfo)) {
            pathInfo.missing = true;
        }
        else if (!!fileInfo) {
            pathInfo.isContainer = fileInfo.isDirectory;
            if (pathInfo.isContainer) {
                pathInfo.children =
                    listDirectoryContents(fileInfo.children);
                if (pathInfo.children.length === 0) {
                    pathInfo.empty = true;
                }
            }
        }

        return promise.resolve(pathInfo);
    }
    /**
    * Condenses the directory tree of files into one list
    * @function
    */
    function listDirectoryContents(children) {
        var filePaths = [];

        children.forEach(function forEachChild(child) {
            //a directory path
            if (
                child.isDirectory
            ) {
                if (
                    !child.missing
                    && !child.empty
                ) {
                    filePaths = filePaths.concat(
                        listDirectoryContents(
                            child.children
                        )
                    );
                }
            }
            //a file path
            else if (filePaths.indexOf(child.path) === -1) {
                filePaths.push(child.path);
            }
        });

        return filePaths;
    }
}
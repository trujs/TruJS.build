/**
* The file path processor takes a path, in path-fragment notation, and uses it to list all files that match the path in the current file system
* @factory
* @feature path-fragment notation
*   @rule minus Any path begining with a dash will be used to remove previously matched file paths
*   @rule plus Any path begining with a plus will be used to match files within the path and all sub directories
*   @rule brackets The contents of a brackets group, [], will be converted to a regex pattern
*   @rule asterisk The first asterisk in a path denotes the begining of the path-fragment, used as the relative path for the destination for passthrough files. All other asterisks will be ignored except file name wildcards, e.g. *.js *.*, name.*
*/
function _FilePathProcessor(
    promise
    , node_path
    , buildHelpers_pathParser
    , buildHelpers_buildPathProcessor
    , buildHelpers_filePathInfo
    , workspacePath
    , defaults
) {
    /**
    *
    * @property
    */
    var DOT_PATT = /[.]/g
    /**
    *
    * @property
    */
    , SEP_PATT = /(?<![\\])[\\\/]/g
    /**
    *
    * @property
    */
    , MOD_PATT = /^((?:\[[^\]]+\])|r|-)?(.+)$/
    ;

    /**
    * @function
    *   @async
    */
    return function FilePathProcessor(
        path
        , projectName
    ) {
        //create an instance of `{iPathFragment}`
        return createPathFragment(
            path
            , projectName
        )
        //then get the meta data for the path
        .then(function thenGetPathMeta(pathFrag) {
            return buildHelpers_filePathInfo(
                pathFrag
            );
        });
    };

    /**
    * Runs the path parser and returns a promise with the results
    * @function
    *   @async
    */
    function createPathFragment(path, projectName) {
        try {
            //turn the build path into a path
            //parse the path
            return promise.resolve(
                buildHelpers_buildPathProcessor(
                    path
                    , projectName
                )
            );
        }
        catch(ex) {
            return promise.reject(ex);
        }
    }
    /**
    *
    * @function
    */
    function getFqPath(path, projectName) {
        //remove the modifier if one exists
        var modMatch = path.match(MOD_PATT)
        , mod = ""
        , sepIndx;

        if (!!modMatch) {
            mod = modMatch[1] || "";
            path = modMatch[2];
        }

        //standardize the path separater to make is easier to deal with
        path = path.replace(SEP_PATT, "/");

        //if the path starts with a . then we begin at the project's root
        if (path[0] === ".") {
            path = node_path.join(
                defaults.sourceDirectory
                , projectDir
                , path
            );
        }
        //if the path begins with {source} then start from the source directory
        else if (path.indexOf("{source}") === 0) {
            path = path.replace(
                "{source}"
                , defaults.sourceDirectory
                , path
            );
        }
        //if the path starts with {project} then the next segment is the project name
        else if (path.indexOf("{project}") === 0) {
            //remove the {project}/, the next string is the project name
            path = path.substring(10);
            sepIndx = path.indexOf("/");
            projectDir = path.substring(
                0
                , sepIndx
            );
            projectDir = projectDir.replace(
                DOT_PATT
                , node_path.sep
            );

            path = path.substring(sepIndx + 1);
            path = node_path.join(
                defaults.sourceDirectory
                , projectDir
                , path
            );
        }

        if (!node_path.isAbsolute(path)) {
            path = node_path.join(
                workspacePath
                , path
            );
        }

        //resolve the path and add the modifier back
        return mod + node_path.resolve(path);
    }
}
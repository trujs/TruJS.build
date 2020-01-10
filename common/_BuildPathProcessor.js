/**
* The build path processor converts the build path into a fully qualified path.
* @factory
*/
function _BuildPathProcessor(
    workspacePath
    , defaults
    , errors
) {
    /**
    * A reg exp pattern for parsing the build path
    * @property
    */
    var BLD_PATH_PATT = /^(\[[A-z0-9, \-+<>]+\])?(?:(?:\{([A-z][A-z0-9_.]*)\})|([.]?[\/]|[A-Z]+[:][\/\\]))?(.*)$/
    /**
    * A reg exp for replacing windows path separaters
    * @property
    */
    , WIN_SEP_PATT = /[\\]/g
    /**
    * A reg exp pattern for replacing dots
    * @property
    */
    , DOT_PATT = /[.]/g
    /**
    * A reg exp pattern for replacing leading path separaters
    * @property
    */
    , LEADING_SEP_PATT = /^[\\\/]/;

    /**
    * @worker
    */
    return function BuildPathProcessor(buildPath, projectName) {
        //create the build path object
        var pathObj = parseBuildPath(
            buildPath
            , projectName
        )
        //get the fully qualified path
        , fqpath = createFullyQualifiedPath(
            pathObj
        );

        return fqpath;
    };

    /**
    * Parses the build path and returns an object with it's parts
    * @function
    */
    function parseBuildPath(buildPath, projectName) {
        var match = buildPath.match(BLD_PATH_PATT)
        , pathObj = {
            "modifier": ""
            , "project": projectName
            , "root": null
            , "path": null
        };
        //if there isn't a match then it's not in build path format
        if (!match) {
            throw new Error(
                `${errors.invalid_build_path} (${buildPath})`
            );
        }
        //first group is the modifier
        if (!!match[1]) {
            pathObj.modifier = match[1];
        }
        //second group is the project name
        if (!!match[2]) {
            pathObj.project = match[2];
        }
        //the third group is the root
        if (!match[3]) {
            match[3] = "./";
        }
        pathObj.root = match[3];
        if (pathObj.root === "./") {
            pathObj.root = `${workspacePath}/${defaults.sourceDirectory}/`;
        }
        else {
            pathObj.isAbsolute = true;
        }

        //the fourth group is the rest of the path
        pathObj.path = match[4] || "";

        return pathObj;
    }
    /**
    * Creates a fully qualified path string using the path object and the project name
    * @function
    */
    function createFullyQualifiedPath(pathObj) {
        var depPath = pathObj.path.replace(LEADING_SEP_PATT, "")
        , projectPath = `${pathObj.project.replace(DOT_PATT, "/")}/`
        , mod = pathObj.modifier
        , root = pathObj.root
        , path;

        //if this is an absolute path then return it
        if (pathObj.isAbsolute) {
            path = `${mod}${root}${depPath}`
        }
        //if the project path is not in the dependency path, then include it
        else if (depPath.indexOf(projectPath) === -1) {
             path = `${mod}${root}${projectPath}${depPath}`;
        }
        else {
             path = `${mod}${root}${depPath}`;
        }

        //standardize the separaters
        path = path.replace(WIN_SEP_PATT, "/");

        return path;
    }
}
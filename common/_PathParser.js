/**
* The path parser does what nodejs path.parse does, except it is compatible with the path-fragment notation, and includes support for URL and URI paths
* @interface iPathFragment
*   @property {string} orig The original path string
*   @property {string} fqpath The fully qualified path
*   @property {string} root The filesystem root
*   @property {string} dir The path without the file name, ext, or fragment
*   @property {string} base The filename and extension
*   @property {string} name The filename, wothout extension
*   @property {string} ext The file extension
*   @property {string} fragment The part of the path after the first asterisk (in the directory) or regular expression, whichever is first.
*   @property {string} modifier The + or - at the front of the path
*   @property {array} segments An array of the path split using the slashes
*
* @factory
*/
function _PathParser(
    defaults
    , errors
) {
    /**
    * A regexp pattern for splitting the path by either slash
    * @property
    */
    var SEP_PATT = /[\/\\]/g
    /**
    * A regexp pattern for finding characters that need escaping
    * @property
    */
    , ESCP_PATT = /[\/\\\.]/g
    /**
    * A regexp pattern for stripping the modifiers from the begining
    * @property
    */
    , MOD_PATT = /^(?:(?:\[([^\]]+)\])|(r|-))?(.+)$/
    /**
    * A regexp pattern to test for a drive letter
    * @property
    */
    , DRV_PATT = /^[A-z]/
    /**
    * A regexp pattern to test for a regular expression in a path
    * @property
    */
    , REGEX_PATT = /<((?:[^>]|(?:(?<=[\\])[>]))+)>/g
    /**
    * A regexp pattern to test for a regular expression
    * @property
    */
    , ASTR_PATT = /[*]/g;

    /**
    *
    * @function
    */
    return function PathParser(path) {
        return parsePath(path);
    }

    /**
    * @function
    */
    function parsePath(path) {
        ///INPUT VALIDATION
        //ensure the path is valid
        if (!path || typeof path !== "string") {
            throw new Error(
                `${errors.invalid_path_fragment} (${path})`
            );
        }
        ///END INPUT VALIDATION
        //start the path fragment
        var pathFrag = startPathFrag(path)
        , lastIndx = pathFrag.segments.length - 1
        ;
        //loop through the path segments and build the path fragment root, dir, base and fragment
        pathFrag.segments.forEach(
            processSegment.bind(null, pathFrag, lastIndx)
        );

        //parse the base
        parseBase(pathFrag);

        //create the fully qualified path
        pathFrag.fqpath = pathFrag.segments.join(pathFrag.sep);

        //create the path that the files can be found in, starting with the dir
        pathFrag.startInPath = pathFrag.dir;
        if (
            !pathFrag.filter
            && !pathFrag.fragment
            && pathFrag.base.indexOf("*") === -1
        ) {
            pathFrag.startInPath+= pathFrag.sep + pathFrag.base;
        }

        pathFrag.matchPath = createRegExpPatt(
            pathFrag.segments.join(pathFrag.sep)
        );

        return pathFrag;
    }
    /**
    * Seperates any modifiers from the path, creates a clean path (without reg exp patterns), and returns a new object with the resulting values
    * @function
    */
    function startPathFrag(path) {
        //seperate the modifier
        var match = path.match(MOD_PATT)
        , mod = (match[1] || match[2])
        //get a path with the regexp removed so we don't split on something inside a regex statment
        , fullPath = match[3]
        , placeholderMap = []
        , cleanPath = getCleanPath(
            fullPath
            , placeholderMap
        )
        , sep = cleanPath.match(SEP_PATT)
            && cleanPath.match(SEP_PATT)[1]
        , segments;

        //update any palholders in the segments
        segments =
            cleanPath.split(SEP_PATT)
            .map(function forEachSeg(seg) {
                return seg.replace(
                    REGEX_PATT
                    , function replacePlaceholder(str, plchlder) {
                        var val = placeholderMap[
                            parseInt(plchlder) - 1
                        ];
                        return `<${val}>`;
                    }
                );
            });

        //turn the modifier into an array
        if (!!mod) {
            mod = mod.split("");
        }
        else {
            mod = [];
        }

        return {
            "orig": path
            , "modifier": mod
            , "segments": segments
            , "sep": sep
            , "recursive": mod.indexOf("r") !== -1
            , "minus": mod.indexOf("-") !== -1
        };
    }
    /**
    * Removes any regular expression value and replaces them with a more path friendly placeholder
    * @function
    */
    function getCleanPath(path, placeholderMap) {
        return path.replace(
            REGEX_PATT
            , function remRegEx(matched, regex) {
                placeholderMap.push(regex);
                return `<${placeholderMap.length}>`;
            }
        );
    }
    /**
    * Determines what the segment is and adds it to the path fragment object
    * @function
    */
    function processSegment(pathFrag, lastIndx, seg, indx) {
        var sep = pathFrag.sep;
        if (indx === 0) {
            pathFrag.root = seg + sep;
            pathFrag.dir = seg;
        }
        else if (indx === lastIndx) {
            if (seg.indexOf(".") !== -1) {
                pathFrag.base = seg;
            }
            else if (seg === "*") {
                pathFrag.base = "*.*";
            }
            else if (!pathFrag.fragment) {
                pathFrag.dir+= sep + seg;
            }
            else {
                pathFrag.fragment+= sep + seg;
            }
        }
        else {
            if (!pathFrag.fragment) {
                if (
                    REGEX_PATT.test(seg)
                    || ASTR_PATT.test(seg)
                ) {
                    pathFrag.fragment = seg;
                }
                else {
                    pathFrag.dir+= sep + seg;
                }
            }
            else {
                pathFrag.fragment+= sep + seg;
            }
        }
    }
    /**
    * Parses the base (file name) into a name and extension
    * @function
    */
    function parseBase(pathFrag) {
        var match;

        if (!!pathFrag.base) {
            pathFrag.name = pathFrag.base.split(".");
            if (pathFrag.name.length > 1) {
                pathFrag.ext = pathFrag.name.pop();
            }
            else {
                pathFrag.ext = "*";
            }
            pathFrag.name = pathFrag.name.join(".");
        }
        else {
            pathFrag.base = "*.*";
            pathFrag.name = "*";
            pathFrag.ext = "*";
        }

        //if the base is regex then convert it to
        if (!!pathFrag.base.match(REGEX_PATT)) {
            pathFrag.filter = createRegExpPatt(pathFrag.base);
        }
    }
    /**
    * Creates a regular expression for the pattern string
    * @function
    */
    function createRegExpPatt(pattStr) {
        var regEntries = []
        , clean = pattStr
            .replace(REGEX_PATT, function replaceReg(match, regexp) {
                regEntries.push(regexp);
                return `<${regEntries.length - 1}>`;
            })
        , escaped = clean
            .replace(ESCP_PATT, function replaceEsc(match) {
                if (match.match(SEP_PATT)) {
                    return "[\\/\\\\]";
                }
                return `[\\${match}]`;
            })
            .replace(ASTR_PATT, ".*")
        , regexp = escaped
            .replace(REGEX_PATT, function reinsertReg(match, num) {
                var reg = regEntries[num];
                return reg;
            })
        ;
        return new RegExp(`${regexp}$`);
    }
}
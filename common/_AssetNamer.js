/**
* Uses the extracted documentation entries, along with the asset path, to determine the namespace and alias of the asset
* @factory
* @interface
*/
function _AssetNamer(
    defaults
    , workspacePath
) {
    /**
    * A regexp pattern for removing leading separaters from the relative path
    * @property
    */
    var LEADING_SEP_PATT =/^[\/\\]+/
    /**
    * A regexp pattern for finding path separaters
    * @property
    */
    , SEP_PATT = /[\/\\]/g
    /**
    * A regexp pattern for splitting a path by the separaters
    * @property
    */
    , SEP_SPLIT_PATT = /[\/\\]/g
    ;

    /**
    * @worker
    */
    return function AssetNamer(asset) {
        //get the naming attribute from the assets docs and any children
        var naming = getNamingProperty(asset.docs)
        , nameObj;
        //if we found a naming attribute then convert it to an instance of `{iNaming}`
        if (!!naming) {
            naming = convertNamingProperty(naming);
        }
        //use the path to determine any missing values
        return createNaming(naming, asset.path);
    };

    /**
    * Finds the first naming attribute
    * @function
    */
    function getNamingProperty(docs) {
        if (!docs) {
            return;
        }

        var naming;

        docs.every(function everyDoc(doc) {
            if (doc.hasOwnProperty("naming")) {
                naming = doc.naming;
                return false;
            }
            return true;
        });

        return naming;
    }
    /**
    * @function
    */
    function convertNamingProperty(naming) {
        var attrs = naming
        , nameObj = {};

        Object.keys(naming)
        .forEach(function forEachAttr(key) {
            nameObj[key] = naming[key] ;
        });

        return nameObj;
    }
    /**
    * @function
    */
    function createNaming(naming, path) {
        //ensure we have a naming property
        naming = naming || {};

        //get the path without the workspace directory
        var relativeDir = getRelativePath(path.dir)
        //use the path to create the namespace (minus the name)
        , namespace = convertToNamespace(relativeDir)
        //use the path name and ext to determine the name
        , name = getName(path.name, path.ext)
        ;

        if(!naming.parent) {
            naming.parent = namespace;
        }
        if (!naming.name) {
            naming.name = name;
        }
        if (!naming.namespace) {
            naming.namespace = `${naming.parent}.${naming.name}`;
        }
        if(!naming.root) {
            naming.root = naming.namespace.split(".")[0];
        }

        return naming;
    }
    /**
    * Removes the workspace path and source directory from the path to create the relative path.
    * @function
    */
    function getRelativePath(dir) {
        var standardizedDir = dir.replace(SEP_PATT, "/");
        //remove the workspace path
        return standardizedDir.replace(
            workspacePath.replace(SEP_PATT, "/")
            , ""
        )
        //remove the source directory
        .replace(
            defaults.sourceDirectory
            , ""
        )
        //remove the left over path separaters from the begining
        .replace(
            LEADING_SEP_PATT
            , ""
        );
    }
    /**
    * Uses the relative path and creates the dot seperated namespace
    * @function
    */
    function convertToNamespace(relativeDir) {
         var segs = relativeDir.split(SEP_SPLIT_PATT);
         return segs.join(".");
    }
    /**
    * Creates the dependency's name, including a file extension suffix
    * @function
    */
    function getName(name, ext) {
        var exceptions = defaults.extSuffixExceptions
        , suffix;

        //there are a couple of extensions that don't get a suffix
        if (exceptions.indexOf(ext) !== -1) {
            return name;
        }

        suffix = ext.substring(1,1).toUpperCase() + ext.substring(2);

        return `${name}${suffix}`;
    }
}
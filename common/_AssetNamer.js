/**
* Uses the extracted documentation entries, along with the asset path, to determine the namespace and alias of the asset
* @factory
* @interface
*/
function _ModuleNamer(
    defaults
    , workspacePath
) {
    /**
    * A regexp pattern for removing leading seperators from the relative path
    * @property
    */
    var LEADING_SEP_PATT =/^[\/\\]+/
    /**
    * A regexp pattern for splitting a path by the seperators
    * @property
    */
    , SEP_SPLIT_PATT = /[\/\\]/g
    ;

    /**
    * @worker
    */
    return function ModuleNamer(asset) {
        //get the naming attribute from the assets docs and any children
        var naming = getNamingAttribute(asset.docs) || {}
        , nameObj;
        //if we found a naming attribute then convert it to an instance of `{iNaming}`
        if (!!naming) {
            naming = convertNamingAttribute(naming);
        }
        //use the path to determine any missing values
        asset.naming = createNaming(naming, asset.path);
    };

    /**
    * Finds the first naming attribute
    * @function
    */
    function getNamingAttribute(docs) {
        if (!docs) {
            return;
        }

        var naming;

        docs.every(function everyDoc(doc) {
            if (doc.attributes.hasOwnProperty("naming")) {
                naming = doc.attributes.naming;
                return false;
            }
            return true;
        });

        return naming;
    }
    /**
    * @function
    */
    function convertNamingAttribute(naming) {
        var attrs = naming.attributes
        , nameObj = {};

        if (!!attrs) {
            Object.keys(attrs)
            .forEach(function forEachAttr(key) {

                nameObj[attrs[key].tag] = attrs[key].name ;
            });
        }

        return nameObj;
    }
    /**
    * @function
    */
    function createNaming(naming, path) {
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
        //remove the workspace path
        return dir.replace(
            workspacePath
            , ""
        )
        //remove the source directory
        .replace(
            defaults.sourceDirectory
            , ""
        )
        //remove the left over path seperators from the begining
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
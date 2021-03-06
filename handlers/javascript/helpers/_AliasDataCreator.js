/**
* The alias data creator generates JavaScript snippets that assign namespaces to aliases, usung any document naming attributes and the file name to determine the namespace
* @factory
*/
function _AliasDataCreator(
    is_string
    , defaults
) {
    /**
    * A regexp pattern for splitting using the dot
    * @property
    */
    var SPLIT_DOT_PATT = /[.]/g
    /**
    * A regexp pattern for getting the function name and arguments
    * @property
    */
    , FUNC_PATT = /function\s*([A-z][A-z0-9_]+)\s*\(\s*(.*?)\s*\)/s
    /**
    * A regexp pattern for removing whitespace, including nl and cr
    * @property
    */
    , WS_PATT = /\s/sg
    /**
    * A regexp pattern for adding standard whitespace characters back to the function arguments
    * @property
    */
    , ARG_SEP_PATT = /[,]/g

    /**
    * @worker
    */
    return function AliasDataCreator(assets) {
        var aliases = []
        , parentNamespaces = []
        , parentEntries = [];

        //loop through the assets and create an alias entry for each
        assets.forEach(function forEachAsset(asset) {
            aliases.push(
                createAliasEntry(
                    asset
                    , parentNamespaces
                )
            );
        });

        //loop through the parent namespaces
        parentNamespaces
        .sort()
        .forEach(function forEachParent(parent) {
            parentEntries.push(
                createSnippet(
                    parent
                )
            );
        });

        //prepend the parent namespaces
        return parentEntries.concat(
            aliases
        );
    };

    /**
    * Uses the asset's `naming.alias` attribute
    * @function
    */
    function createAliasEntry(asset, parentNamespaces) {
        var alias = getNamingAlias(asset)
        , aliasSegs = alias.split(SPLIT_DOT_PATT)
        , parent = aliasSegs
            .splice(0,aliasSegs.length - 1)
            .join(".");

        //add the parent to the list of parents
        if (!!parent && parentNamespaces.indexOf(parent) === -1) {
            parentNamespaces.push(
                parent
            );
        }

        //create the JavaScript snippet
        alias = createSnippet(
            alias
            , asset
        );

        return alias;
    }
    /**
    * Finds the naming attribure
    * @function
    */
    function getNamingAlias(asset) {
        if (!asset.hasOwnProperty(defaults.docEntryPropertyName)) {
            return getDefaultAlias(asset);
        }

        var naming, alias;

        asset[defaults.docEntryPropertyName]
        .every(function everyDoc(doc) {
            //find the naming alias
            if (doc.hasOwnProperty("naming")) {
                naming = doc.naming;
                if (!!naming && naming.hasOwnProperty("alias")) {
                    alias = naming.alias.name;
                    return false;
                }
            }
            return true;
        });

        if (alias) {
            return alias;
        }

        return getDefaultAlias(asset);
    }
    /**
    * Turns the file name into an alias
    * @function
    */
    function getDefaultAlias(asset) {
        var alias = asset.path.name;
        if (alias[0] === "_") {
            alias = alias.substring(1);
        }
        return alias[0].toLowerCase() + alias.substring(1);
    }
    /**
    * Creates JavaScript snippet for the alias
    * @function
    */
    function createSnippet(alias, asset) {
        var snippet = alias
        , data = !!asset && asset.data
        , namespace
        , isFactory
        , match;
        //if there isn't a dot then this is the root variable name declare it
        if (snippet.indexOf(".") === -1) {
            snippet = `var ${snippet}`;
        }
        //if the data is a string then test for a function
        if (is_string(data)) {
            namespace = !!asset.naming && asset.naming.namespace;
            isFactory = !!asset.meta && asset.meta.isFactory || false;
            if (isFactory) {
                match = data.match(FUNC_PATT);
                data = match[2]
                    .replace(WS_PATT,"")
                    .replace(ARG_SEP_PATT,"\n    , ");
                snippet = `${snippet} = ${namespace}(\n    ${data}\n);`;
            }
            else {
                snippet = `${snippet} = ${namespace};`;
            }
        }
        //if there isn't an equals then the snippet isn't finished,make it an empty object
        if (snippet.indexOf("=") === -1) {
            snippet = `${snippet} = {};`;
        }

        return snippet;
    }
}
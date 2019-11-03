/**
* The namespace data creator takes the full collection of namespaces and turns them into an array of JavaScript snippets with namespace assignments
* @factory
*/
function _NamespaceDataCreator(

) {
    /**
    * A reg exp pattern for matching a JavaScript function at the begining of the text data, splitting the data into 2 capture groups, the first is anything before the `function` keyword, and the second is everything else (including the function keyword)
    * @property
    */
    var FUNC_PATT = /^((?:(?:[/][*]{2}(?:.+?)(?<=[*])[/])|(?:[/]{2}[^\r\n]*)|\s)+)(function\s+(?:\s*[[A-z_][A-z0-9_-]+\s*)?\s*\([^\)]+\)\s*\{.*\})$/s
    ;

    /**
    * @worker
    */
    return function NamespaceDataCreator(namespaces) {
        var namespaceData = [];

        Object.keys(namespaces)
        .forEach(function forEachNs(namespace) {
            namespaceData.push(
                createNamespaceData(
                    namespace
                    , namespaces[namespace]
                )
            );
        });

        return namespaceData;
    };

    /**
    * Combines the namespace and the data into a JavaScript entry
    * @function
    */
    function createNamespaceData(namespace, asset) {
        var match, prefix = "";

        //see if this is a root, if so we'll need to use the var declaration
        if( namespace.indexOf(".") === -1) {
            prefix = "var ";
        }

        //if the asset is null then it's a namespace root or parent
        if (asset === null) {
            return `/**\n* @namespace ${namespace}\n*/\n${prefix}${namespace} = {};`;
        }

        //see if this is JavaScript
        if (asset.path.ext === ".js") {
            //test for a function at the begining of the file
            match = asset.data.match(FUNC_PATT);
            if (!!match) {
                return `${match[1]}${prefix}${namespace} =\n${match[2]};`;
            }
            //JavaScript that's not a function must be a snippet or scriptlet
            return asset.data;
        }
        //if this is json
        else if (asset.path.ext === ".json") {
            return `${prefix}${namespace} =\n${asset.data};`;
        }
        //if this is utf8 the return the value as a string
        else if (asset.encoding === "utf8") {
            return `${prefix}${namespace} = "${asset.data}";`;
        }

        ///DEBUG
        throw new Error("TODO: add data handler");
        ///END DEBUG
    }
}
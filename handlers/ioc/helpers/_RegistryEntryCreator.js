/**
*
* @factory
*/
function _RegistryEntryCreator(
    buildHelpers_ioc_javaScriptMetaExtractor
    , is_empty
    , errors
) {
    /**
    * A regexp pattern to remove the leading comments from a javascript file
    * @property
    */
    var LEADING_COMM_PATT = /^^(?:(?:[/][*]{2}(?:.+?)(?<=[*])[/])|(?:[/]{2}[^\r\n]*)|\s)+/ms
    /**
    * A regexp pattern for matching underscores
    * @property
    */
    , LD_PATT = /[_]/g
    /**
    * @alias
    */
    , javaScriptMetaExtractor = buildHelpers_ioc_javaScriptMetaExtractor
    ;

    /**
    * @worker
    */
    return function RegistryEntryCreator(config, asset) {
        var namespace = asset.naming.namespace
        , value = asset.data
        , deps
        , options;
        //if this is javascript get the meta data
        if (asset.path.ext === ".js") {
            //remove any leading comments
            value = value.replace(LEADING_COMM_PATT, "");
            //try to get meta info about the asset
            var meta = javaScriptMetaExtractor(
                asset
            );
            if (meta.isFactory) {
                deps = getFactoryDependencies(
                    meta
                );
                if (!is_empty(deps)) {
                    options = {
                        "dependencies": deps
                    };
                }
            }
        }
        //if not json we'll need to encapsulate it
        else if (asset.path.ext !== ".json") {
            value = `"${value}"`;
        }

        return {
            "namespace": namespace
            , "value": value
            , "options": options
        };
    };

    /**
    * Changes the arguments to abstract namespace notation
    * @function
    */
    function getFactoryDependencies(meta) {
        return meta.arguments.map(function mapArgs(arg) {
            return [`.${arg.replace(LD_PATT, ".")}`];
        });
    }
}
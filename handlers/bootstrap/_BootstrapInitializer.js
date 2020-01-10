/**
*
* @factory
*/
function _BootstrapInitializer (
    promise
    , bootstrapTemplates
    , utils_lookup
    , is
    , errors
) {
    /**
    * A regular expression pattern to match variable entries `${name}` in a string
    * @property
    */
    var VAR_PATT = /\$\{([^\}]+)\}/g

    /**
    * @worker
    */
    return function BootstrapInitializer (
        entry
    ) {
        try {
            if (
                !is.string(entry.bootstrapType)
                || is.empty(entry.bootstrapType)
            ) {
                throw new Error(
                    `${errors.invalid_bootstrap_type} (${entry.bootstrapType})`
                );
            }
            //get the snippet paths from the templates object
            var key = `${entry.bootstrapType}.snippets`
            , snippets = utils_lookup(
                key
                , bootstrapTemplates
            );
            //verify we have a snippets array
            if(!is.array(snippets)) {
                throw new Error(
                    `${errors.missing_bootstrap_snippets} (${entry.bootstrapType})`
                );
            }
            //update any variables in each path
            snippets = snippets.map(function mapSnippets(snippet) {
                return mergeSnippetPathEntry(
                    snippet
                    , entry
                );
            });

            //add the snippets to the
            if (is.array(entry.paths)) {
                entry.paths = entry.paths.concat(snippets);
            }
            else {
                entry.paths = snippets;
            }

            return promise.resolve();
        }
        catch (ex) {
            return promise.reject(ex);
        }
    };

    /**
    * @function
    */
    function mergeSnippetPathEntry(snippet, entry) {
        return snippet.replace(VAR_PATT, function replaceVar(match, name) {
            var val = utils_lookup(
                name
                , entry
            );
            if (is.nill(val)) {
                val = "";
            }
            return val;
        });
    }
}
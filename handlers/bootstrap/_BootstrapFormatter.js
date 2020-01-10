/**
*
* @factory
*/
function _BootstrapFormatter (
    promise
    , utils_reference
    , defaults
    , errors
) {
    /**
    * A regular expression pattern for replacing bind variables in the entry value.
    * @property
    */
    var VAR_PATT = /\$\{([^\}]+)\}/g;

    /**
    * @worker
    */
    return function BootstrapFormatter (
        entry
        , assets
    ) {
        try {
            var data = assets[0].data
            , templateDefaults = entry.templateDefaults;

            data = data.replace(VAR_PATT, function replaceVars(match, name) {
                var ref = utils_reference(name, entry)
                , val = "";
                if (ref.found && ref.value !== undefined) {
                    val = ref.value;
                }
                else if (templateDefaults.hasOwnProperty(name)) {
                    val = templateDefaults[name];
                }
                if (typeof val === "object") {
                    val = JSON.stringify(val);
                }
                return val;
            });

            assets[0].data = data;

            return promise.resolve(assets);
        }
        catch (ex) {
            return promise.reject(ex);
        }
    };
}
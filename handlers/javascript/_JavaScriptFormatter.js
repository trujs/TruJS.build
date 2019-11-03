/**
* @factory
*/
function _JavaScriptFormatter(
    promise
) {

    /**
    * @worker
    */
    return function JavaScriptFormatter(
        entry
        , assets
    ) {
        try {
            var data = assets[0].data
            , strict = !!entry.javascript
                ? entry.javascript.strict || true
                : true;

            //add strict
            if (strict === true) {
                data = `"use strict";\n\n${data}`;
            }

            assets[0].data = data;

            return promise.resolve(assets);
        }
        catch(ex) {
            return promise.reject(ex);
        }
    };
}
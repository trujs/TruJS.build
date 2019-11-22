/**
*
* @factory
*/
function _TestAssembler(
    promise
    , defaults
) {

    /**
    * @worker
    */
    return function TestAssembler(
        entry
        , assets
    ) {
        try {
            var tests = [];

            //loop through the assets and add them to an array
            assets.forEach(function forEachAsset(asset) {
                tests.push(asset);
            });

            return promise.resolve(
                [{
                    "data": tests
                }]
            );
        }
        catch(ex) {
            return promise.reject(ex);
        }
    };
}
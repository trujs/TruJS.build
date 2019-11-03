/**
*
* @factory
*/
function _JavaScriptPreProcessor(
    promise
    , buildHelpers_docExtractor
    , buildHelpers_assetNamer
) {

    /**
    * @worker
    */
    return function JavaScriptPreProcessor(
        entry
        , assets
    ) {
        //loop through each asset and preprocess them
        return startAssetLoop(
            assets
        );
    };

    /**
    * Loops through the asset array and starts a promise to process each
    * @function
    */
    function startAssetLoop(assets) {
        var procs = [];

        assets.forEach(function forEachAsset(asset) {
            procs.push(
                new promise(
                    processAsset.bind(null, asset)
                )
            );
        });

        return promise.all(
            procs
        );
    }
    /**
    * Processes a single asset, extracts document comments and determines the namespace
    * @function
    */
    function processAsset(asset, resolve, reject) {
        try {
            //extract documentation comments
            buildHelpers_docExtractor(asset);
            //determine namespace
            buildHelpers_assetNamer(asset);

            resolve(asset);
        }
        catch(ex) {
            reject(ex);
        }
    }
}
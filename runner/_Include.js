/**
* Processes the `include` properties for each manifest entry, after each build step, to include the resulting assets from other workflows. The include represent a pause of all the workflows after each step in the build process so that resulting assets from one workflow can be added to another without race conditions.
* @factory
*   @singleton
*   @dependency {promise} promise ["+Promise"]
*   @dependency {function} is_nill [":TruJS.core.is.Nill"]
*   @dependency {function} utils_copy [":TruJS.core.object.Copy"]
*   @dependency {object} reporter [":TruJS.core.log._Reporter"]
*   @dependency {function} processDetails [":TruJS.core.log._ProcessDetails"]
*   @dependency {object} defaults [":TruJS.build.runner.Defaults"]
*/
function _Include(
    promise
    , is_nill
    , is_array
    , utils_copy
    , reporter
    , processDetails
    , defaults
) {

    /**
    * @worker
    *   @async
    */
    return function Include(
        buildOp
        , assets
        , stepName
        , parentProcDetail
    ) {
        try {
            //loop through the entries
            buildOp.manifest
                .forEach(function forEachEntry(entry, indx) {
                    assets[indx] =
                        processInclude(
                            entry
                            , indx
                            , assets
                            , stepName
                            , parentProcDetail
                        );
                });

            return promise.resolve(assets);
        }
        catch(ex) {
            return promise.reject(ex);
        }
    };

    /**
    * @function
    */
    function processInclude(entry, entryIndex, assets, stepName, procDetail) {
        //get the include value for this name
        var propertyKey = (`${stepName}Property`).replace("-","")
        , propertyName = defaults.includeProperties[propertyKey]
        , includeAr = entry.include
            ? entry.include[propertyName]
            : null
        , entryAssets = assets[entryIndex];

        if (is_nill(includeAr)) {
            return entryAssets;
        }

        if (!is_array(includeAr)) {
            includeAr = [includeAr];
        }
        ///LOGGING
        var stepProcDetail = processDetails(
            `${stepName}.include`
            , "_Include.processInclude"
            , procDetail
        );
        reporter.info(
            `Including Assets From ${includeAr}`
            , stepProcDetail
        );
        ///END LOGGING
        //loop through the include array
        includeAr.forEach(function forEachValue(include) {
            var includeIndex = include;
            //if the include is negative then minus it from the entry index
            if (includeIndex < 0) {
                includeIndex = entryIndex + includeIndex;
            }
            //create a copy of the included index's entry assets to remove references
            var includeAssets = utils_copy(assets[includeIndex]);
            if (is_array(includeAssets)) {
                //mark the included assets
                includeAssets
                .forEach(function forEachIncludedAsset(asset,indx) {
                    asset.included = {
                        "includeName": propertyName
                        , "originalIndex": include
                        , "resolvedIndex": includeIndex
                        , "assetIndex": indx
                    };
                });
                //combine the entry's and the included assets
                entryAssets = entryAssets.concat(includeAssets);
            }
        });

        return entryAssets;
    }
}
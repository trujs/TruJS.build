/**
* This asyncronous utility
* @factory
*   @dependency {promise} promise ["+Promise"]
*   @dependency {object} defaults [":TruJS.build.runner.Defaults"]
*/
function _Include(
    promise
    , is_nill
    , defaults
    , processDetails
    , reporter
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

        if (!Array.isArray(includeAr)) {
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
            var includeAssets = assets[include];
            if (Array.isArray(includeAssets)) {
                entryAssets = entryAssets.concat(includeAssets);
            }
        });

        return entryAssets;
    }
}
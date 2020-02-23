/**
* Processes the `include` properties for each manifest entry, after each build step, to include the resulting assets from other workflows. The include represent a pause of all the workflows after each step in the build process so that resulting assets from one workflow can be added to another without race conditions.
* @factory
*   @singleton
*   @dependency {promise} promise ["+Promise"]
*   @dependency {function} is_nill [":TruJS.core.is.Nill"]
*   @dependency {function} is_array [":TruJS.core.is.Array"]
*   @dependency {function} is_string [":TruJS.core.is.String"]
*   @dependency {function} utils_copy [":TruJS.core.object.Copy"]
*   @dependency {object} reporter [":TruJS.core.log._Reporter"]
*   @dependency {function} processDetails [":TruJS.core.log._ProcessDetails"]
*   @dependency {object} defaults [":TruJS.build.runner.Defaults"]
*/
function _Include(
    promise
    , is_nill
    , is_array
    , is_string
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
            var manifestKeys = buildOp.manifest.map(function mapKeys(entry) {
                return entry.name;
            });
            //loop through the entries
            buildOp.manifest
            .forEach(function forEachEntry(entry, indx) {
                assets[indx] =
                    processIncludes(
                        entry
                        , indx
                        , assets
                        , manifestKeys
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
    function processIncludes(entry, index, assets, keys, stepName, procDetail) {
        //get the include value for this name
        var propertyKey = (`${stepName}Property`).replace("-","")
        , includeName = defaults.includeProperties[propertyKey]
        , includeAr = !!entry.include
            ? entry.include[includeName]
            : null
        , entryAssets = assets[index];

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
        includeAr.forEach(function forEachInclude(include) {
            entryAssets = processInclude(
                assets
                , index
                , keys
                , includeName
                , include
            );
        });

        return entryAssets;
    }
    /**
    * @function
    */
    function processInclude(assets, entryIndex, keys, includeName, include) {
        var includeIndex = include
        , entryAssets = assets[entryIndex]
        ;
        //if the included index is a string, translate it
        if (is_string(include)) {
            includeIndex =
                Object.values(keys)
                .indexOf(include)
            ;
        }
        //if the include is negative then minus it from the entry index
        if (includeIndex < 0) {
            includeIndex = entryIndex + includeIndex;
        }

        if (is_array(assets[includeIndex])) {
            //create a copy of the included index's entry assets to remove references
            var includeAssets = utils_copy(
                assets[includeIndex]
            );

            return appendIncludedAssets(
                entryAssets
                , includeAssets
                , {
                    "includeName": includeName
                    , "originalIndex": include
                    , "resolvedIndex": includeIndex
                    , "assetIndex": -1
                }
            );
        }

        return entryAssets;
    }
    /**
    * @function
    */
    function appendIncludedAssets(entryAssets, includeAssets, included) {
        var finalAssets = utils_copy(entryAssets);

        includeAssets
        .forEach(function forEachIncludedAsset(asset, indx) {
            //mark the included asset
            asset.included = utils_copy(included);
            asset.included.assetIndex = indx;
            //add it to the
            finalAssets.push(
                asset
            );
        });

        return finalAssets;
    }
}
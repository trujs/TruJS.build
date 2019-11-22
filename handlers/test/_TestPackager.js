/**
*
* @factory
*/
function _TestPackager(
    promise
    , is_array
) {

    /**
    * @worker
    */
    return function TestPackager(
        entry
        , assets
    ) {
        //add any includes
        return new promise(
            addIncludes.bind(null, entry, assets)
        );
    };

    /**
    * @function
    */
    function addIncludes(entry, assets, resolve, reject) {
        try {
            //the first asset is the test data asset
            var testAsset = assets.shift()
            , testData = testAsset.data
            , include = entry.include
            , includeKeys = Object.keys(include)
            ;
            //loop through the units and find the matching asset(s) for each
            Object.keys(entry.units)
            .forEach(function forEachUnit(unitKey) {
                var unitAsset = getUnitAsset(
                    entry.units[unitKey]
                    , assets
                );
                //for now only take the first match
                if (is_array(unitAsset)) {
                    unitAsset = unitAsset[0];
                }

                testData.push(
                    {
                        "type": "unit"
                        , "name": unitKey
                        , "data": unitAsset.data
                    }
                );
            });

            testAsset.data = JSON.stringify(testData);

            resolve([testAsset]);
        }
        catch(ex) {
            reject(ex);
        }
    }
    /**
    * @function
    */
    function getUnitAsset(unit, assets) {
        var includedAssets = []
        , includeKey = Object.keys(unit.include)[0]
        , include = unit.include[includeKey]
        ;

        assets
        .every(function everyAsset(asset) {
            if (asset.included.includeName === includeKey) {
                if (asset.included.originalIndex === include) {
                    includedAssets.push(asset);
                    return false;
                }
            }
            return true;
        });

        if (includedAssets.length === 1) {
            return includedAssets[0];
        }
        return includedAssets;
    }
}
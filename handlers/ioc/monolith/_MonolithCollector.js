/**
*
* @factory
*/
function _MonolithCollector(
    promise
    , buildHandlers_file_collect
) {

    /**
    * @alias
    */
    var fileCollect = buildHandlers_file_collect
    ;

    /**
    * @worker
    */
    return function MonolithCollector(
        entry
        , assets
        , procDetail
    ) {
        //run the file collection
        return fileCollect(
            entry
            , assets
            , procDetail
        )
        //then add the dtree entries to the assets
        .then(function thenAddPathData(assets) {

            return addDtreeEntries(
                entry
                , assets
            );
        });
    };

    /**
    * If there are "entries" on the asset, they are from the IOC and will be processed and added to the meta for downstream evaluation
    * @function
    */
    function getFactoryEntryMetaData(asset) {
        //skip if there aren't any entries
        if (!asset.entries) {
            return {};
        }

        var factoryEntryMeta = {
            "overrideArguments": []
            , "isFactory": false
        };

        //look through each factory entry, as each might have alternate argument dependencies
        asset.entries
        .forEach(function forEachEntry(entry) {
            //skip if this isn't a factory
            if (entry.type !== "factory") {
                return;
            }
            //set that this is a factory
            factoryEntryMeta.isFactory = true;
            //loop through the dependencies
            entry.dependencies
            .forEach(function forEachDep(dep, indx) {
                if (dep !== "\b") {
                    factoryEntryMeta.overrideArguments[indx] = dep;
                }
            });
        });

        return factoryEntryMeta;
    }
    /**
    * @function
    */
    function addDtreeEntries(entry, assets) {
        try {
            //add the dtree entries that produced the asset, to each asset
            assets.forEach(function forEachAsset(asset,indx) {
                asset.entries = entry.dtreeEntries[indx].entries;
            });

            //remove the initial entries array, since we just distributed the entries among the assets
            delete entry.dtreeEntries;

            return promise.resolve(assets);
        }
        catch(ex) {
            return promise.reject(ex);
        }
    }
}
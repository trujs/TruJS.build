/**
*
* @factory
*/
function _ExpressPreProcessor(
    promise
    , buildHandlers_ioc_monolith_preprocess
    , buildHelpers_express_expressKitCreator
    , buildHelpers_express_kitDepTreeUpdater
    , fs_fileInfo
    , defaults
) {

    /**
    * @constants
    */
    var cnsts = {
        "kitDataPlaceholder": "{file data}"
    }
    /**
    * @alias
    */
    , preprocess = buildHandlers_ioc_monolith_preprocess
    /**
    * @alias
    */
    , expressKitCreator = buildHelpers_express_expressKitCreator
    /**
    * @alias
    */
    , kitDepTreeUpdater = buildHelpers_express_kitDepTreeUpdater
    /**
    * A regular expression for matching periods
    * @property
    */
    , DOT_PATT = /[.]/g
    /**
    * A regular expression for matching quotes
    * @property
    */
    , QOUTE_PATT = /["]/g
    ;

    /**
    * @worker
    */
    return function ExpressPreProcessor(
        entry
        , assets
        , processDetail
    ) {
        var expressKit;

        //add a placeholder file for the express kit, so it gets processed
        return createKitAsset(
            entry
        )
        //preprocess the assets with the monolith pre processor
        .then(function thenPreProcessAssets(kitAsset) {
            assets.push(
                kitAsset
            );
            return preprocess(
                entry
                , assets
                , processDetail
            );
        })
        //then create an express app/router kit
        .then(function thenCreateExpressKit(preProcAssets) {
            return expressKitCreator(
                entry
                , preProcAssets
            );
        })
        //then add the kit to the assets
        .then(function thenAddKit(kit) {
            expressKit = kit;
            return updateKitAsset(
                kit
                , assets
            );
        })
        //then create entries on the dependency tree for the items in the express kit
        .then(function thenAddDepTreeEntries(kitNamespace) {
            //Update the dependency tree
            return kitDepTreeUpdater(
                entry
                , expressKit
                , kitNamespace
            );
        })
        //then resolve the assets
        .then(function thenResolveAssets() {
            return promise.resolve(assets);
        });
    }

    /**
    * @function
    */
    function createKitAsset(entry) {
        try {
            var project = entry.config.project
            , namespace = `${project}.${entry.config.routeBranchName}`
            , fileName = `${namespace.replace(DOT_PATT, "/")}/${defaults.routeKitName}`
            , file = fs_fileInfo(
                fileName
                , cnsts.kitDataPlaceholder
            );

            return promise.resolve(file);
        }
        catch(ex) {
            return promise.reject(ex);
        }
    }
    /**
    * Creates a file object with the kit as the file data, and adds it to the assets
    * @function
    */
    function updateKitAsset(kit, assets) {
        try {
            var kitAsset = assets[assets.length -1]
            , kitData = JSON.stringify(kit)
            , updData = kitAsset.data
                .replace(`${cnsts.kitDataPlaceholder}`, kitData);

            kitAsset.data = updData;

            return promise.resolve(kitAsset.naming.namespace);
        }
        catch(ex) {
            return promise.reject(ex);
        }
    }
}
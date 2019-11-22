/**
*
* @factory
*/
function _TestFormatter(
    promise
    , fs_fileInfo
    , defaults
) {

    /**
    * @worker
    */
    return function TestFormatter(
        entry
        , assets
    ) {
        try {
            //the tests collection should be the first asset
            var testAsset = assets.shift()
            , testData = testAsset.data
            , nameTemplate = defaults.unitUnderTestNameTemplate
            ;

            assets.forEach(function forEachAsset(asset, index) {
                var name = nameTemplate.replace("${index}", index + 1);

                testData.push(
                    {
                        "name": name
                        , "data": `${asset.data}`
                        , "type": "setup"
                    }
                );
            });

            return promise.resolve(
                [
                    fs_fileInfo(
                        entry.config.fileName || defaults.testFileName
                        , testData
                    )
                ]
            );
        }
        catch(ex) {
            return promise.reject(ex);
        }
    };
}
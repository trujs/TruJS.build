/**
* The test preprocessor
* @factory
*/
function _TestPreprocessor(
    promise
    , buildHelpers_docExtractor
    , defaults
) {
    /**
    * @constants
    */
    var cnsts = {
        "skipProperties": [
            "indent"
            , "raw"
            , "tag"
            , "offset"
        ]
    }
    /**
    * A regular expression to trim leading and trailing NLCR and whitespace
    * @property
    */
    , TRIM_PATT = /^[\r\n ]*(.+\S)[\r\n ]*$/s
    /**
    * @alias
    */
    , docExtractor = buildHelpers_docExtractor
    ;

    /**
    * @worker
    */
    return function TestPreprocessor(
        entry
        , assets
    ) {
        //extract the test entries from the assets
        return new promise(
            extractTestEntries.bind(null, assets)
        );
    };

    /**
    * @function
    */
    function extractTestEntries(assets, resolve, reject) {
        try {
            var tests = [];

            assets.forEach(function forEachAsset(asset) {
                tests = tests.concat(
                    processAsset(asset)
                );
            });

            resolve(tests);
        }
        catch(ex) {
            reject(ex);
        }
    }
    /**
    * @function
    */
    function processAsset(asset) {
        var docs = docExtractor(asset)
        , tests = [];

        //loop through the doc assets, for the test entries,
        docs.forEach(function forEachDocEntry(entry, indx) {
            //process the doc entry's test property
            if (!!entry.test) {
                //create the test asset and add it to the list
                tests.push(
                    createTestAsset(
                        entry
                        , asset.data
                    )
                );
            }
        });

        return tests;
    }
    /**
    * @function
    */
    function createTestAsset(entry, data) {
        var test = {};
        //loop through the test properties, skipping the meta properties
        Object.keys(entry.test)
        .filter(function filterKeys(key) {
            return cnsts.skipProperties.indexOf(key) === -1;
        })
        .forEach(function forEachKey(key) {
            var prop = entry.test[key];
            test[key] = prop.name || prop.desc;
        });
        //pull the test code from the data
        test.data = data.substring(
            entry.documentEnd
            , entry.offsetEnd
        );
        test.data = test.data.match(TRIM_PATT)[1];

        //make sure we have a test type
        if (!test.hasOwnProperty(defaults.type)) {
            test.type = defaults.testEntryType;
        }

        return test;
    }
}
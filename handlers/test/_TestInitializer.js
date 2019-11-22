/**
* The test initializer ensures the manifest entry has a test file entry in the `paths` array, as well as applies the default manifest entry configuration and adds required dependencies to the dtree
* @factory
* @config
*   @property {string} pathSuffix The file name suffix used as a filter
*
*/
function _TestInitializer(
    promise
    , is_array
    , is_object
    , is_numeric
    , utils_copy
    , defaults
) {

    /**
    * @worker
    */
    return function TestInitializer(
        entry
    ) {
        //add the test wildcard path to the manifest entry
        return addPathSuffix(
            entry
        )
        //then set determine the unit(s) under test
        .then(function thenDetermineUnitUnderTest() {
            return determineUnitUnderTest(entry);
        });
    };

    /**
    * Adds the default *.test.js entry to the paths property
    * @function
    */
    function addPathSuffix(entry) {
        try {
            ///INPUT VALIDATION
            //add the files entry if one doesn't exist
            if (!entry.hasOwnProperty(defaults.pathsPropertyName)) {
                entry[defaults.pathsPropertyName] = [];
            }
            //if the files entry is not an array
            if (!is_array(entry[defaults.pathsPropertyName])) {
                throw new Error(
                    `${errors.invalid_paths_property} (${typeof entry[defaults.pathsPropertyName]})`
                );
            }
            ///END INPUT VALIDATION

            //see if there is an entry with route.js in it
            if (!hasTestPathEntry(entry)) {
                entry[defaults.pathsPropertyName]
                    .push(`[r]./*${entry.config.test.pathSuffix}`);
            }

            return promise.resolve();
        }
        catch(ex) {
            return promise.reject(ex);
        }
    }
    /**
    * Checks the paths property for a test.js entry
    * @function
    */
    function hasTestPathEntry(entry) {
        var notFound =
            entry[defaults.pathsPropertyName]
            .every(function everyPath(path) {
                if (path.indexOf(entry.config.test.pathSuffix) !== -1) {
                    return false;
                }
                return true;
            });
        return !notFound;
    }
    /**
    * @function
    */
    function determineUnitUnderTest(entry) {
        try {
            var unitNameTemplate = defaults.unitUnderTestNameTemplate
            , unitName
            , includePropNames = Object.values(defaults.includeProperties)
            ;
            ///INPUT VALIDATION
            //if there are unit properties process them, looking for shorthand includes
            if (entry.hasOwnProperty("units")) {
                //check each unit to see if it's using shorthand
                Object.keys(entry.units)
                .forEach(function forEachKey(key) {
                    var unit = entry.units[key], includeIndex;
                    if (!is_object(unit)) {
                        includeIndex = unit;
                        unit = entry.units[key] = {};
                    }
                    if (!unit.hasOwnProperty("include")) {
                        unit.include = {};
                    }
                    //if the include index is not numeric
                    if (!is_numeric(includeIndex)) {
                        //for now use the default
                        ///TODO: see if throwing an error is more appropriate
                        includeIndex = defaults.testIncludeIndex;
                    }
                    unit.include[defaults.testIncludeType] = includeIndex;
                });
            }
            //if we don't have a `units` property, create the default
            if (!entry.hasOwnProperty("units")) {
                entry.units = {};
            }
            //if we don't have any include entries
            if (Object.keys(entry.units).length === 0) {
                unitName = unitNameTemplate.replace("${index}", 1);
                entry.units[unitName] = {
                    "include": {}
                };
                entry.units[unitName].include[defaults.testIncludeType] =
                    defaults.testIncludeIndex;
            }
            ///END INPUT VALIDATION

            //loop through the entry's units and add any includes
            Object.keys(entry.units)
            .forEach(function forEachUnit(key) {
                var unit = entry.units[key]
                , unitInclude = unit.include
                , entryInclude = entry.include;
                ///INPUT VALIDATION
                if (!is_object(entryInclude)) {
                    entryInclude = entry.include = {};
                }
                ///END INPUT VALIDATION
                Object.keys(unitInclude)
                .forEach(function forEachUniutInclude(key) {
                    var includeValue = unitInclude[key];
                    ///INPUT VALIDATION
                    if (!entryInclude.hasOwnProperty(key)) {
                        entryInclude[key] = [];
                    }
                    else if (!is_array(entryInclude[key])) {
                        entryInclude[key] = [entryInclude[key]];
                    }
                    ///END INPUT VALIDATION
                    entryInclude[key].push(
                        includeValue
                    );
                });
            });

            return promise.resolve();
        }
        catch(ex) {
            return promise.reject(ex);
        }
    }
}
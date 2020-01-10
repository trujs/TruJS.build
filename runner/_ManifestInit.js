/**
* The ManifestInit utility uses the raw manifest object to generate an array of `{iManifestEntry}` instances. The `entries` property is the base for the array, each member is initialized and the default properties are applied to the entry object. The root properties in the manifest, other than the entries property, are add to each manifest entry; as a copy so no references exist between manifest entries.
* @factory
*   @dependency {function} utils_copy [":TruJS.core.object.Copy"]
*   @dependency {function} utils_merge [":TruJS.core.object.Merge"]
*   @dependency {function} utils_reference [":TruJS.core.object.Reference"]
*   @dependency {function} is_object [":TruJS.core.is.Object"]
*   @dependency {function} is_array [":TruJS.core.is.Array"]
*   @dependency {object} defaults [":TruJS.build.runner.Defaults"]
*   @dependency {object} errors [":TruJS.build.runner.Errors"]
* @interface iManifestEntry
*   @property {string} type The build type to use for this manifest entry
*/
function _ManifestInit(
    utils_copy
    , utils_merge
    , utils_reference
    , is_object
    , is_array
    , defaults
    , errors
) {
    /**
    * A regular expression pattern for replacing bind variables in the entry value.
    * @property
    */
    var VAR_PATT = /\$\{([^\}]+)\}/g;

    /**
    * @worker
    */
    return function ManifestInit(manifest) {
        //get the entries and create the default values object
        var entries = manifest[defaults.manifestEntriesPropertyName]
        , manifestDefaults;

        if (!Array.isArray(entries)) {
            throw new Error(`${errors.invalid_manifest} (${typeof entries})`);
        }

        //create a copy to remove any external references
        entries = utils_copy(
            entries
        );

        //copy the manifest, we'll use it as default values for each entry
        manifestDefaults = utils_copy(manifest);
        //remove the entries property from the default values
        delete manifestDefaults[defaults.manifestEntriesPropertyName];

        //loop through the entries and merge each with the defaults
        return entries.map(function mapEntry(entry, index) {
            var mergedEntry = utils_merge(
                entry
                , utils_copy(manifestDefaults) // don't share references
            );

            //update entry properties
            updateProperties(mergedEntry, mergedEntry);

            return mergedEntry;
        });
    };

    /**
    * @function
    */
    function updateProperties(entry, obj) {
        Object.keys(obj)
        .forEach(function forEachKey(key) {
            var val = obj[key];
            if (is_object(val) || is_array(val)) {
                updateProperties(entry, val);
            }
            else if (typeof val === "string") {
                while(VAR_PATT.test(obj[key])) {
                    obj[key] =
                        obj[key].replace(
                            VAR_PATT
                            , function updateVar(match, name) {
                                var ref = utils_reference(name, entry);
                                if (ref.found) {
                                    return ref.value;
                                }
                                return "";
                            }
                        );
                }
            }
        });
    }
}
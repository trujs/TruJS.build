/**
* The ManifestInit utility uses the raw manifest object to generate an array of `{iManifestEntry}` instances. The `entries` property is the base for the array, each member is initialized and the default properties are applied to the entry object. The root properties in the manifest, other than the entries property, are add to each manifest entry; as a copy so no references exist between manifest entries.
* @factory
*   @dependency {function} utils_copy [":TruJS.core.object.Copy"]
*   @dependency {function} utils_apply [":TruJS.core.object.Apply"]
*   @dependency {object} defaults [":TruJS.build.runner.Defaults"]
*   @dependency {object} errors [":TruJS.build.runner.Errors"]
* @interface iManifestEntry
*   @property {string} type The build type to use for this manifest entry
*/
function _ManifestInit(
    utils_copy
    , utils_merge
    , utils_reference
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
            var entry = utils_merge(
                utils_copy(manifestDefaults)// don't share references
                , entry
            );

            //update entry properties
            updateProperties(entry, entry);

            return entry;
        });
    };

    /**
    * @function
    */
    function updateProperties(entry, obj) {
        Object.keys(obj)
        .forEach(function forEachKey(key) {
            var val = obj[key];
            if (typeof val === "object") {
                updateProperties(entry, val);
            }
            else if (typeof val === "string") {
                obj[key] = 
                    val.replace(VAR_PATT, function updateVar(match, name) {
                        var ref = utils_reference(name, entry);
                        if (ref.found) {
                            return ref.value;
                        }
                        return "";
                    });
            }
        });
    }
}
/**
* The ManifestInit utility uses the raw manifest object to generate an array of `{iManifestEntry}` instances. The `entries` property is the base for the array, each member is initialized and the default properties are applied to the entry object.
* @factory
*   @dependency {object} defaults [":TruJS.build.runner.Defaults"]
*   @dependency {object} errors [":TruJS.build.runner.Errors"]
*   @dependency {function} utils_copy [".utils.copy"]
*   @dependency {function} utils_apply [".utils.apply"]
* -
* @interface iManifestEntry
*   @property {string} type The build type to use for this manifest entry
*/
function _ManifestInit(
    defaults
    , errors
    , utils_copy
    , utils_merge
) {

    /**
    * @worker
    */
    return function ManifestInit(manifest) {
        //get the entries and create the default values object

        var entries = manifest[defaults.manifestEntriesPropertyName]
        , manifestDefaults = manifest;

        if (!Array.isArray(entries)) {
            throw new Error(`${errors.invalid_manifest} (${typeof entries})`);
        }

        //remove the entries property from the default values
        delete manifestDefaults[defaults.manifestEntriesPropertyName];

        //create a copy to remove any external references
        entries = utils_copy(
            entries
        );
        manifestDefaults = utils_copy(
            manifestDefaults
        );

        //loop through the entries
        entries.forEach(function forEachEntry(entry) {
            utils_merge(
                entry
                , manifestDefaults
            );
        });

        return entries;
    };
}
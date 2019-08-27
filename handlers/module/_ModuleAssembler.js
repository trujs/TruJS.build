/**
*
* @factory
*/
function _ModuleAssembler(
    promise
    , buildHelpers_trujs_module_moduleDataCreator
    , fs_fileInfo
    , reporter
    , defaults
) {

    /**
    * @alias
    */
    var moduleDataCreator = buildHelpers_trujs_module_moduleDataCreator;

    /**
    *  @worker
    */
    return function ModuleAssembler(
        entry
        , assets
    ) {
        //convert the assets to JavaScript module entries
        return new promise(
            convertAssets.bind(null, entry, assets)
        )
        //then join the entries and create a single file
        .then(function thenCreateAsset(dataArray) {
            return new promise(
                createAssembledAsset.bind(null, entry, dataArray)
            );
        })
    };

    /**
    * @function
    */
    function convertAssets(entry, assets, resolve, reject) {
        try {
            var moduleEntries = moduleDataCreator(
                assets
            );

            resolve(moduleEntries);
        }
        catch(ex) {
            reject(ex);
        }
    }
    /**
    * Creates the assembled asset
    * @function
    */
    function createAssembledAsset(entry, dataArray, resolve, reject) {
        try {
            //concat the namespaces and file data
            var data, fileName, fileExt, file;

            data = dataArray.join("\n\n");
            fileName = !!entry.assembler
                && entry.assembler.fileName
                || defaults.assembledFileName;
            fileExt = !!entry.assembler
                && entry.assembler.fileExt
                || defaults.assembledfileExt;
            file = fs_fileInfo(
                `${fileName}.${fileExt}`
                , data
            );

            resolve ([file]);
        }
        catch(ex) {
            reject(ex);
        }
    }
}
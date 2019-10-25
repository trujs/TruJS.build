/**
* The file saver loops through the assets and saves them to the `output` path described in the manifest entry.
* @factory
*/
function _FileSaver(
    promise
    , nodePath
    , fs_fileWriter
    , workspacePath
    , defaults
) {

    /**
    * @worker
    *   @async
    */
    return function FileSaver(
        entry
        , assets
    ) {
        //loop through the assets, determine destination, save asset
        return startSaveLoop(
            entry
            , assets
        );
    };

    /**
    * @function
    */
    function startSaveLoop(entry, assets) {
        try {
            //if there isn't an output property then skip saving
            if (!entry.config.output) {
                return promise.resolve();
            }

            var procs = []
            , outputPath = entry.config.output;

            //ensure the output path is absolute
            if (!nodePath.isAbsolute(outputPath)) {
                outputPath = nodePath.join(
                    workspacePath
                    , entry.config.buildsDirectory
                    , outputPath
                );
            }

            assets.forEach(function forEachAsset(asset) {
                procs.push(
                    saveFile(
                        entry
                        , asset
                        , outputPath
                    )
                );
            });

            return promise.all(procs);
        }
        catch(ex) {
            return promise.reject(ex);
        }
    }
    /**
    * @function
    */
    function saveFile(entry, asset, outputPath) {
        try {
            var path = determineOutputPath(entry, asset, outputPath);

            return fs_fileWriter(
                path
                , asset.data
            );
        }
        catch(ex) {
            return promise.reject();
        }
    }
    /**
    * @function
    */
    function determineOutputPath(entry, asset, outputPath) {
        var config = entry.config;
        //if the output path is a directory then add the asset's fragment and file name to it
        if (
            !nodePath.extname(outputPath)
            && !!asset.path
        ) {
            //add the path fragment if one exists
            if (!!asset.path.fragment) {
                outputPath = nodePath.join(
                    outputPath
                    , asset.path.fragment
                );
            }
            //add the file name
            if (!!asset.path.base) {
                outputPath = nodePath.join(
                    outputPath
                    , asset.path.base
                );
            }
        }
        //if there isn't a file name now, use the default
        if (!nodePath.extname(outputPath)) {
            outputPath = nodePath.join(
                outputPath
                , config.appFileName
            );
        }

        return outputPath;
    }
}
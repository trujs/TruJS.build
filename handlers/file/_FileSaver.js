/**
* The file saver loops through the assets and saves them to the `output` path described in the manifest entry.
* @factory
*/
function _FileSaver(
    promise
    , node_path
    , fs_fileWriter
    , workspacePath
    , is_nill
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
        //if there isn't an output config then skip
        if (is_nill(entry.config.output)) {
            return promise.resolve([]);
        }
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
            if (!node_path.isAbsolute(outputPath)) {
                outputPath = node_path.join(
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
            !node_path.extname(outputPath)
            && !!asset.path
        ) {
            //add the path fragment if one exists
            if (!!asset.path.fragment) {
                outputPath = node_path.join(
                    outputPath
                    , asset.path.fragment
                );
            }
            //add the newPath if exists
            if (asset.path.hasOwnProperty("newPath")) {
                outputPath = node_path.join(
                    outputPath
                    , asset.path.newPath
                );
            }
            //add the file name if needed
            if (
                !node_path.extname(outputPath)
                && !!asset.path.base
            ) {
                outputPath = node_path.join(
                    outputPath
                    , asset.path.base
                );
            }
        }
        //if there isn't a file name now, use the default
        if (!node_path.extname(outputPath)) {
            outputPath = node_path.join(
                outputPath
                , config.fileName
            );
        }

        return outputPath;
    }
}
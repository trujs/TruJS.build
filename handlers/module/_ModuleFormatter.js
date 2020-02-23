/**
*
* @factory
*/
function _ModuleFormatter(
    promise
    , fs_fileInfo
    , buildHandlers_javascript_format
    , is_array
) {
    /**
    * A collection of constants
    * @property
    */
    var cnsts = {
        "export": {
            "node": "module.exports = "
            , "browser": "export default "
        }
        , "defaultEngine": "browser"
    }
    /**
    * @alias
    */
    , javascriptFormat = buildHandlers_javascript_format
    ;

    /**
    * @worker
    */
    return function ModuleFormatter(
        entry
        , assets
    ) {
        //format the module
        return new promise(
            formatAssets.bind(null, entry, assets)
        )
        //then format the javascript
        .then(function thenFormatJavascript(updateAssets) {
            return javascriptFormat(
                entry
                , updateAssets
            );
        });
    };

    /**
    * @factory
    */
    function formatAssets(entry, assets, resolve, reject) {
        try {
            var modFile = assets[0]
            , modData = modFile.data
            , statement
            , engine = entry.config.engine || cnsts.defaultEngine
            , exp = entry.moduleExport
            , exportCmd = `${cnsts.export[engine]}${exp};`
            //use the filename from the manifest entry
            , fileName = entry.config.fileName;

            //add the export statement
            modData = `${modData}\n\n${exportCmd}`;

            if(!!entry.module) {
                //add any statements
                if (!!entry.module.statements) {
                    if (!!entry.module.statements.beginning) {
                        statement = entry.module.statements.beginning;
                        if(is_array(statement)) {
                            statement = statement.join("\n");
                        }
                        modData = `${statement}\n\n${modData}`;
                    }
                    if (!!entry.module.statements.ending) {
                        statement = entry.module.statements.ending;
                        if(is_array(statement)) {
                            statement = statement.join("\n");
                        }
                        modData = `${statement}\n\n${modData}`;
                    }
                }
            }

            modFile = fs_fileInfo(
                fileName
                , modData
            );

            resolve([modFile]);
        }
        catch(ex) {
            reject(ex);
        }
    }
}
/**
*
* @factory
*/
function _ModuleFormatter(
    promise
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
    };

    /**
    * @worker
    */
    return function ModuleFormatter(
        entry
        , assets
    ) {
        return new promise(
            formatAssets.bind(null, entry, assets)
        );
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
            , exp = entry.config.export;

            //add the export statement
            modData = `${modData}\n\n${cnsts.export[engine]}${exp};`;

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
                //add strict
                if (entry.module.strict === true) {
                    modData = `"use strict";\n\n${modData}`;
                }
            }

            modFile.data = modData;

            resolve([modFile]);
        }
        catch(ex) {
            reject(ex);
        }
    }
}
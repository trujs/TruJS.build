/**
*
* @factory
*/
function _ModuleFormatter(
    promise
    , is_array
) {

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
            , engine = entry.engine || "browser"
            , exp = entry.export;

            //add the export
            if (engine === "browser") {
                modData = `${modData}\n\nexport default ${exp};`;
            }
            else if (engine === "node") {
                modData = `${modData}\n\nmodule.exports = ${exp};`;
            }

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
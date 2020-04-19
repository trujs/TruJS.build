/**
* This asyncronous utility loads the build manifest file, along with the optional configuration file, based on the command line arguments. It then merges the default configuration, the command line arguments and the loaded configuration file. Finally it returns an instance of `{iBuildOperation}`
*
* @interface iBuildOperation
*   @property {object} manifest The loaded manifest
*   @property {object} config The loaded config and/or the command line arguments and a property with the command line flags
* @factory
*   @dependency {promise} promise ["+Promise"]
*   @dependency {object} node_path ["+require('path')"]
*   @dependency {object} node_fs ["+require('fs')"]
*   @dependency {string} workspacePath ["+process.cwd()"]
*   @dependency {promise} manifestLoader [":TruJS.build.runner._ManifestLoader",[]]
*   @dependency {object} utils_merge [":TruJS.object._Merge"]
*   @dependency {object} utils_reference [":TruJS.object._Reference"]
*   @dependency {object} utils_ensure [":TruJS.object._Ensure"]
*   @dependency {object} is_object [":TruJS.core.is.Object"]
*   @dependency {object} defaults [":TruJS.build.runner.Defaults"]
*   @dependency {object} errors [":TruJS.build.runner.Errors"]
*/
function _BuildInit(
    promise
    , node_path
    , workspacePath
    , fs_fileLoader
    , manifestLoader
    , utils_merge
    , utils_reference
    , utils_ensure
    , is_object
    , defaults
    , errors
) {
    /**
    * A regular expression pattern for matching path separaters
    * @property
    */
    var PATH_SEP_PATT = /[\\\/]/g
    ;

    /**
    * @worker
    *   @async
    */
    return function BuildInit(cmdArgs) {
        var manifest, entries;
        //load the manifest and config file
        return promise.all([
            loadManifest(cmdArgs)
            , loadConfig(cmdArgs)
        ])
        //modify config file with cmdArgs
        .then(function thenMergeConfig(files) {
            manifest = files[0];
            return mergeArgsConfig(
                cmdArgs
                , files[1]
            );
        })
        //return instance of {iBuildOperation}
        .then(function thenReturnBuildOp(config) {
            return {
                "manifest": manifest
                , "config": config
            };
        });
    };

    /**
    * Determines the path to the manifest based on the command line arguments and loads the file
    * @function
    */
    function loadManifest(cmdArgs) {
        try {
            //determine the manifest path from the command line arguments
            var manPathStr = getPath("manifest", cmdArgs)
            , basePathStr = getProjectPath(cmdArgs)
            ;

            //make sure we found a path
            if (!manPathStr) {
                return promise.reject(
                    new Error(`${errors.missing_manifest_path}`)
                );
            }

            //run the manifest file loader
            return manifestLoader(
                manPathStr
                , basePathStr
            );
        }
        catch(ex) {
            return promise.reject(ex);
        }
    }
    /**
    * Determines the path to the config file, and if found, loads the file
    * @function
    */
    function loadConfig(cmdArgs) {
        try {
            var cfgPathStr = cmdArgs.arguments.config
                && getPath("config", cmdArgs)
            , basePathStr
            ;

            //make sure we found a path
            if (!cfgPathStr) {
                return promise.resolve();
            }

            //convert a relative path
            if (cfgPathStr[0] === ".") {
                basePathStr = getProjectPath(cmdArgs);
                cfgPathStr = `${basePathStr}/${cfgPathStr.substring(1)}`;
            }

            //run the file loader
            return fs_fileLoader(
                cfgPathStr
            );
        }
        catch(ex) {
            return promise.reject(ex);
        }
    }
    /**
    * Uses the command line arguments and the desired property name to figure out what the path should be, using the project and command as fallbacks
    * @function
    */
    function getPath(name, cmdArgs) {
        var path;

        //start with the manifest command line argument
        if (cmdArgs.arguments[name] !== undefined) {
            //we're expecting the manifest argument to be a path
            path = cmdArgs.arguments[name];
        }
        //if the value is empty then use the default
        if (!path) {
            path = defaults[`${name}FileName`];
        }
        //if the path is just a fine name then add a ./
        if (node_path.dirname(path) === ".") {
            path = `./${path}`;
        }

        return path;
    }
    /**
    * Get project path
    * @function
    */
    function getProjectPath(cmdArgs) {
        var path = "";
        //if there is a project argument, use that
        if (!!cmdArgs.arguments.project) {
            path = cmdArgs.arguments.project
                .split(".")
                .join("/");
        }
        //otherwise the command value could be the project name or manifest path
        else if (!!cmdArgs.command) {
            //no FS path separater, must be the project name
            if (!cmdArgs.command.match(PATH_SEP_PATT)) {
                path = cmdArgs.command
                    .split(".")
                    .join("/");
            }

            else {
                path = cmdArgs.command;
            }
        }

        //add the workspace directory for relative paths
        if (!node_path.isAbsolute(path)) {
            path = node_path.join(
                workspacePath
                , defaults.sourceDirectory
                , path
            );
        }

        return path;
    }
    /**
    * Adds the `cmdArgs.arguments` properties to the `config` object and the `cmdArgs.flags` as a property on the `config` object.
    * @function
    */
    function mergeArgsConfig(cmdArgs, config) {
        try {
            //starting empty
            if (!config) {
                config = {};
            }

            if (!!cmdArgs.arguments) {
                //loop through the arguments keys and merge each property with the config ,except for the config argument itself
                Object.keys(cmdArgs.arguments)
                .forEach(function forEachKey(key) {
                    if (key !== "config") {
                        var argVal = cmdArgs.arguments[key]
                        , configRef = getConfigPropertyAtPath(
                            config
                            , key
                        );

                        //if the argument value is an object then merge it with the config value
                        if (is_object(argVal) && is_object(configRef.value)) {
                            configRef.parent[configRef.index] =
                                utils_merge(
                                    configRef.value
                                    , argVal
                                );
                        }
                        //otherwise set the config at key to the argument value
                        else {
                            configRef.parent[configRef.index] = argVal;
                        }
                    }
                });
            }

            if (!!cmdArgs.flags && cmdArgs.flags.length !== 0) {
                //add the flags to the config
                if (!config.flags) {
                    config.flags = cmdArgs.flags;
                }
                else {
                    config.flags = config.flags.concat(cmdArgs.flags);
                }
            }

            if (!!cmdArgs.command && !config.project) {
                config.project = cmdArgs.command;
            }

            //merge the default configuration
            config = utils_merge(
                config
                , defaults.config
            );

            return promise.resolve(config);
        }
        catch(ex) {
            return promise.reject(ex);
        }
    }
    /**
    * @function
    */
    function getConfigPropertyAtPath(config, key) {
        //ensure the property exists
        utils_ensure(key, config);
        //get a reference for the key in the config
        var ref = utils_reference(
            key
            , config
        );

        return ref;
    }
}
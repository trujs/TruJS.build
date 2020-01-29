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
*   @dependency {promise} manifestInit [":TruJS.build.runner._ManifestInit",[]]
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
    , node_fs
    , workspacePath
    , manifestInit
    , utils_merge
    , utils_reference
    , utils_ensure
    , is_object
    , defaults
    , errors
) {

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
        //convert the manifest object to an array of {iManifestEntry} instances
        .then(function thenConvertManifest(config) {
            manifest = manifestInit(manifest, config);
            return promise.resolve(config);
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
            var manPathStr = getPath("manifest", cmdArgs, true);

            //make sure we found a path
            if (!manPathStr) {
                return promise.reject(
                    new Error(`${errors.missing_manifest_path}`)
                );
            }

            //run the file loader
            return readFile(manPathStr);
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
            var cfgPathStr = getPath("config", cmdArgs);

            //make sure we found a path
            if (!cfgPathStr) {
                return promise.resolve();
            }

            //run the file loader
            return readFile(cfgPathStr);
        }
        catch(ex) {
            return promise.reject(ex);
        }
    }
    /**
    * Uses the command line arguments and the desired property name to figure out what the path should be, using the project and command as fallbacks
    * @function
    */
    function getPath(name, cmdArgs, fallback) {
        var path;

        //start with the manifest command line argument
        if (cmdArgs.arguments[name] !== undefined) {
            //we're expecting the manifest argument to be a path
            path = cmdArgs.arguments[name];
            //if the value is empty then use the default
            if (!path) {
                path = defaults[`${name}FileName`];
            }
        }
        //if not found we could use the project name; dot notation
        else if (
            !!cmdArgs.arguments.project
            && fallback
        ) {
            path = cmdArgs.arguments.project
                .split(".")
                .join("/");
        }
        //the command value could be the project name or manifest path
        else if (
            !!cmdArgs.command
            && fallback
        ) {
            //no FS path separater, must be the project name
            if (cmdArgs.command.indexOf("/") === -1
                && cmdArgs.command.indexOf("\\") === -1) {
                path = cmdArgs.command
                    .split(".")
                    .join("/");
            }
            else {
                path = cmdArgs.command;
            }
        }

        if (!path) {
            return "";
        }

        //add the project path if this is just a file name
        if (node_path.dirname(path) === ".") {
            path = node_path.join(
                getPath(null, cmdArgs, true)
                , path
            );
        }

        //add the project path if the path starts with .
        if (path[0] === "." && path[1] !== ".") {
            path = node_path.join(
                getPath(null, cmdArgs, true)
                , path
            );
        }

        //add the workspace directory for relative paths
        if (!node_path.isAbsolute(path)) {
            path = node_path.join(
                workspacePath
                , defaults.sourceDirectory
                , path
            );
        }

        //add the default file name if missing
        if (
            node_path.extname(path) === ""
            && !!name
        ) {
            path = node_path.join(
                path
                , defaults[`${name}FileName`]
            );
        }

        return path;
    }
    /**
    * Attemnpts to read the data from file at `path`
    * @function
    */
    function readFile(path) {
        //start a promise
        return new promise(function thenReadFile(resolve, reject) {
            //start the read process
            node_fs.readFile(
                path
                , 'utf8'
                , function readFileCb(err, data) {
                    try {
                        if (!err) {
                            resolve(
                                JSON.parse(data)
                            );
                            return;
                        }
                    }
                    catch(ex) {
                        err = ex;
                    }
                    reject(err);
                }
            );
        });
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
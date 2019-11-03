/**
* The BuildStep represents a step in the build workflow. It uses the step name to resolve the build step handler. If a handler is resolved, it is executed for each instance of `{iManifestEntry}` in the manifest.
*
* The build step will execute the build step handler for each entry in either a linear or a concurrent process, depending on the build op config.
* @config buildStepRunType
*   @value linear The step handler will be executed for each entry sequentially, starting with the first member of the entries array and ending with the last.
*   @value concurrent The step handler will be executed for the
* @factory
*   @dependency {promise} promise ["+Promise"]
*   @dependency {object} reporter [".reporter"]
*   @dependency {object} buildHandlers [".buildHandlers"]
*   @dependency {function} utils_copy [":TruJS.Copy"]
*   @dependency {function} utils_lookup [":TruJS.Copy"]
*   @dependency {object} defaults [":TruJS.build.runner.Defaults"]
*   @dependency {object} errors [":TruJS.build.runner.Errors"]
*   @dependency {function} processDetails [":TruJS.log._ProcessDetails"]
*/
function _BuildStep(
    promise
    , reporter
    , buildHandlers
    , utils_copy
    , utils_lookup
    , defaults
    , errors
    , processDetails
) {

    /**
    * @worker
    *   @async
    */
    return function BuildStep(
        buildOp
        , assets
        , stepName
        , parentProcDetail
    ) {
        ///LOGGING
        var procDetail = processDetails(
            stepName
            , "_BuildStep.BuildStep"
            , parentProcDetail
        );
        reporter.info(
            `Build Step "${stepName}" Started`
            , procDetail
        );
        ///END LOGGING

        //loop through the manifest entries
        return manifestEntryLoop(
            buildOp
            , assets
            , stepName
            , procDetail
        )
        //then make a copy to remove any references
        .then(function thenCopyAssets(assets) {
            return promise.resolve(
                utils_copy(assets)
            );
        })
        //LOGGING
        .then(function thenLogComplete(assets) {
            reporter.info(
                `Build Step "${stepName}" Completed`
                , procDetail
            );
            return promise.resolve(assets);
        });
        ///END LOGGING
    };

    /**
    * Loops through the manifest entries, executing the handler for each.
    * @function
    *   @async
    */
    function manifestEntryLoop(buildOp, assets, stepName, procDetail) {
        var stepConfig = buildOp.config[stepName]
        , loopType = !!stepConfig
            && stepConfig[defaults.buildStepLoopTypePropertyName]
            || defaults.buildStepLoopType;

        if (loopType === "linear") {
            return manifestEntryLoopLinear(
                buildOp
                , assets
                , stepName
                , procDetail
            );
        }
        else {
            return manifestEntryLoopConcurrent(
                buildOp
                , assets
                , stepName
                , procDetail
            );
        }
    }
    /**
    * @function
    *   @async
    */
    function manifestEntryLoopLinear(buildOp, assets, stepName, procDetail) {
        var proc = promise.resolve()
        , results = [];

        //loop through each manifest entry and add a new link in the chain for each
        buildOp.manifest
            .forEach(function forEachEntry(entry, indx) {
                //create the next link in the chain
                proc = proc.then(function thenNextEntry(result) {
                    if (indx > 0) {
                        //record the resulting assets
                        results.push(result);
                    }
                    //execute the step handler
                    return executeStepHandler(
                        entry
                        , assets[indx]
                        , stepName
                        , procDetail
                    );
                });
            });

        //after the last entry is processed, return the results
        return proc.then(function thenResolveResults(result) {
            //record the resulting assets
            results.push(result);
            //resolve results
            return promise.resolve(results);
        });
    }
    /**
    * @function
    *   @async
    */
    function manifestEntryLoopConcurrent(buildOp, assets, stepName, procDetail) {
        //loop through the manifest entries
        return promise.all(
            //create the array of step handler promises
            buildOp.manifest
                .map(function mapEntry(entry, indx) {
                    //execute the step handler
                    return executeStepHandler(
                        entry
                        , assets[indx]
                        , stepName
                        , procDetail
                    );
                })
        );
    }
    /**
    * @function
    */
    function executeStepHandler(entry, assets, stepName, procDetail) {
        try {
            var typeName = entry[defaults.manifestEntryBuildTypePropertyName]
            , buildType = utils_lookup(
                typeName
                , buildHandlers
            )
            , stepHandler, stepProcDetail
            , entryName = entry.name || "unnamed";

            if (!buildType) {
                throw new Error(`${errors.invalid_build_type} (${typeName})`);
            }

            ///LOGGING
            stepProcDetail = processDetails(
                `${stepName}.${typeName}.${entryName}`
                , "_BuildStep.executeStepHandler"
                , procDetail
            );
            ///END LOGGING

            stepHandler = buildType[stepName];

            //run the handler
            if (!!stepHandler) {
                ///LOGGING
                reporter.info(
                    `Step handler for "[${typeName}] ${entryName}" Started`
                    , stepProcDetail
                );
                ///END LOGGING

                //execute the step handler
                return stepHandler(
                    entry
                    , assets
                    , stepProcDetail
                )
                //the validate we have assets returned
                .then(function thenValidateAssets(assets) {
                    assets = assets || [];
                    ///LOGGING
                    reporter.info(
                        `Step Handler for "{${typeName}} ${entryName}" Completed with ${assets.length} Asset(s)`
                        , stepProcDetail
                    );
                    ///END LOGGING
                    return promise.resolve(assets);
                });
            }
            else {
                ///LOGGING
                reporter.extended(
                    `Step handler for "{${typeName}} ${entryName}" was Skipped`
                    , stepProcDetail
                );
                ///END LOGGING

                return promise.resolve(assets);
            }

        }
        catch(ex) {
            return promise.reject(ex);
        }
    }
}
/**
* The builder is an asyncronous workflow that executes 5 extendable steps for each `{iManifestEntry}` in an instance of `{iManifest}`. Each step is optional and will be skipped for any `{iManifestEntry}.buildType` that does not implement that step.
* Steps:
*   - Collect: Collects the required assets
*   - Preprocess: A chance to modify and/or test the collected assets before they are assembled.
*   - Assemble: Assembles 1..n assets into 1..x assets
*   - Format: A chance to format the assets created during assembly
*   - Save: Saves the output assets
*
* After each step is completed, any `{iManifestEntry}` can ask to include assets from the other `{iManifestEntry}`s using an include definition in the requesting `{iManifestEntry}`.
*
* @factory
*   @dependency {promise} promise ["+Promise"]
*   @dependency {promise} include [":TruJS.build.runner._Inlcude"]
*   @dependency {promise} buildStep [":TruJS.build.runner._BuildStep"]
*   @dependency {function} utils_copy [":TruJS.object.Copy"]
*   @dependency {function} utils_merge [":TruJS.object.Merge"]
*   @dependency {object} reporter [":TruJS.core.log._Reporter"]
*   @dependency {function} processDetails [":TruJS.core.log._ProcessDetails"]
*   @dependency {object} defaults [":TruJS.build.runner.Defaults"]
*/
function _Builder(
    promise
    , include
    , buildStep
    , utils_copy
    , utils_merge
    , reporter
    , processDetails
    , defaults
) {

    /**
    * @worker
    *   @workflow
    *   @async
    */
    return function Builder(buildOp) {
        ///LOGGING
        var procDetail = processDetails(
            "builder"
            , "_Builder.Builder"
        );
        reporter.info(
            "Builder Started"
            , procDetail
        );
        ///END LOGGING
        //update the manifest entries with the global config
        var proc = mergeGlobalConfig(
            buildOp
        )
        //then create an empty array for holding the assets
        .then(function thenCreateAssetsArray() {
            return createEmptyAssetsArray(
                buildOp.manifest.length
            );
        });

        //loop through the build steps
        defaults.buildSteps
        .forEach(function forEachStep(step) {
            //add a promise for this step to the chain
            proc = proc.then(function thenRunStep(assets) {
                return buildStep(
                    buildOp
                    , assets
                    , step
                    , procDetail
                );
            });
            //add a promise for the post step include
            proc = proc.then(function thenAddInclude(assets) {
                return include(
                    buildOp
                    , assets
                    , step
                    , procDetail
                );
            });
        });

        //LOGGING
        proc = proc.then(function thenLogComplete(assets) {
            reporter.info(
                "Builder Completed"
                , procDetail
            );
            return promise.resolve(assets);
        });
        //END LOGGING

        return proc;
    };

    /**
    * Merges the global config with each manifest entry's config
    * @function
    */
    function mergeGlobalConfig(buildOp) {
        try {
            //loop through the manifest entries
            buildOp.manifest
            .forEach(function mergeConfig(entry) {
                if (!entry.hasOwnProperty("config")) {
                    entry.config = utils_copy(
                        buildOp.config
                    );
                }
                else {
                    entry.config = utils_merge(
                        entry.config
                        , buildOp.config
                    );
                }
            });

            return promise.resolve();
        }
        catch(ex) {
            return promise.reject(ex);
        }
    }
    /**
    * @function
    */
    function createEmptyAssetsArray(length) {
        var assets = new Array(length)
            .map(function mapAr() {
                return [];
            });
        return promise.resolve(assets);
    }
}
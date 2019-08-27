/**
* The build runner is an asyncronous utility that initializes the build, sets up any file watchers or web service listners, and then runs the build.
* @factory
*   @dependency {promise} promise ["+Promise"]
*   @dependency {promise} buildInit [":TruJS.build.runner._BuildInit",[]]
*   @dependency {promise} builder [":TruJS.build.runner._Builder",[]]
*/
function _BuildRunner(
    promise
    , buildInit
    , builder
) {

    /**
    * @worker
    */
    return function BuildRunner(cmdArgs) {
        //initialize the build
        return buildInit(
            cmdArgs
        )
        //setup runner
        .then(function thenSetupRunner(buildOp) {
            return setupRunner(buildOp);
        })
        //start the builder loop
        .then(function thenStartBuilderLoop(buildOp) {
            return startBuilderLoop(buildOp);
        });
    };
    /**
    * Start and file watchers and web service listners
    * @function
    */
    function setupRunner(config) {
        //TODO: implement the runner setup
        return promise.resolve(config);
    }
    /**
    * Run the builder. If looping then wait for build signal.
    * @function
    */
    function startBuilderLoop(buildOp) {
        return builder(buildOp);
    }
}
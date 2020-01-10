/**
* a local reference to the application object
* @property
*/
var localApp
/**
* ${description}
* @application ${appName}
*   @version ${config.version}
* @template
*   @variable {string} [iocControllerPath] "../../TruJS/ioc/ioc-controller-node.js"
*   @variable {string} appContainerPath
*   @variable {string} appDtreePath
*   @variable {string} [cmdArgsPath] "../../TruJS/cmdArgs.js"
*   @variable {boolean} [config.export] false
*   @variable {string} appName
*   @variable {string} [config.version] "local"
*   @variable {array} [config.reporterLevels] ["info","error","stack"]
*   @variable {string} iocGlobals {
        "require": require
        , "process": process
        , "Promise": Promise
    }
*/
, appProcess =
    initializeApplication(

    )
    .then(function thenSetupController(app) {
        localApp = app;
        return setupApp(
            app
        );
    })
    .then(function thenStartController() {
        return localApp.controller.run(
            localApp.cmdArgs
        );
    })
    .then(function thenReportRan() {
        localApp.reporter.info(
            messages.controller_ran
        );

        return Promise.resolve(localApp);
    })
    .catch(function catchErr(err) {
        if (!!localApp && !!localApp.reporter) {
            localApp.reporter.error(err);
        }
        else {
            console.log(err);
        }
    });
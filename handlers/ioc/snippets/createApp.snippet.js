/**
* @function
*/
function createApp(modules) {
    try {
        var appContainerPath, appDtreePath, iocControllerPath, cmdArgsPath, app;
        //destructure the resulting array of modules
        [
            appContainerPath
            , appDtreePath
            , iocControllerPath
            , cmdArgsPath
        ] = modules;
        //create the application object
        app = Object.create(
            null
            , {
                "container": {
                    "enumerable": true
                    , "value": appContainerPath
                }
                , "dependencyTree": {
                    "enumerable": true
                    , "value": appDtreePath
                }
                , "controller": {
                    "enumerable": true
                    , "value": iocControllerPath
                }
                , "reporter": {
                    "enumerable": true
                    , "value": iocControllerPath
                             .setup
                             .getReporter()
                }
                , "cmdArgs": {
                    "enumerable": true
                    , "value": cmdArgsPath
                }
            }
        );

        //setup the application reporter as close to the start as possible
        app.reporter
            .setCategories(${config.reporterLevels})
            .addListener(function (msgObj) {
                printMessage(msgObj);
            });

        app.reporter.info(
            messages.loaded
        );

        return Promise.resolve(app);
    }
    catch(ex) {
        return Promise.reject(ex);
    }
}
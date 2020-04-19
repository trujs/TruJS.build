/**
* @function
*/
function createApp(modules) {
    try {
        var appContainerPath = modules[0]
        , appDtreePath = modules[1]
        , iocControllerPath = modules[2]
        , options = modules[3]
        , app;
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
                , "options": {
                    "enumerable": true
                    , "value": options
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
/**
* Loads modules required by the application
* @function
*/
function initializeApplication() {
    //load dependencies
    return Promise.all([
        import("${appContainerPath}")
        , import("${appDtreePath}")
        , import("${iocControllerPath}")
        , import("${cmdArgsPath}")
    ])
    .then(function thenCreateApp(modules) {
        return createApp(
            modules
        );
    });
}
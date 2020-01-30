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
    ])
    .then(function thenCreateApp(modules) {
        modules[0] = modules[0].default;
        modules[1] = modules[1].default;
        modules[2] = modules[2].default;
        modules[3] = location.href;
        //add the options to the end of the modules array
        return createApp(
            modules
        );
    });
}
/**
* Loads modules required by the application
* @function
*/
function initializeApplication() {
    return createApp([
        require("${appContainerPath}")
        , require("${appDtreePath}")
        , require('${iocControllerPath}')
        , require('${cmdArgsPath}')
    ]);
}
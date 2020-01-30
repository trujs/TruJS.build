/**
*
* @function
*/
function setupApp(app) {
    try {
        //setup IOC controller
        app.controller
            .setup
            .setContainer(app.container)
            .setAbstractTree(app.dependencyTree)
            .setGlobal(
                {
                    "global": window
                    , "document": document
                    , "location": location
                    , "Promise": Promise
                    , "URL": URL
                }
            )
        ;

        //add the ioc reporter as a dependency
        app.controller.dependency.upsert(
            ".reporter"
            , app.reporter
        );

        //report setup done
        app.reporter.info(
            `System Setup Complete`
        );

        return Promise.resolve(app);
    }
    catch(ex) {
        return Promise.reject(ex);
    }
}
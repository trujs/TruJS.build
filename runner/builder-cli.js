var app = {
    "container": null
    , "controller": null
    , "dependency": null
    , "source": null
    , "reporter": null
    , "cmdArgs": null
};

//setup the application
setup();

//start the controller
app.controller
.run(app.cmdArgs)
.then(function thenReportRan() {
    app.reporter.info("Run Completed");
})
.catch(function catchErr(err) {
    if (!!app.reporter) {
        app.reporter.error(err);
    }
    else {
        console.log(err);
    }
});

/**
* @function
*/
function setup() {
    //gather the dependencies
    var dtree = require("./builder-dtree.js")
    , sourceList = require("./sourceList.js")
    , consumerRefs = require("./consumerRefs.js");

    app.container = require("./builder-node.js");
    app.cmdArgs = require('../cmdArgs.js');

    app.controller = require('../ioc/ioc-controller-node.js');

    app.dependency = app.controller.dependency;
    app.source = app.controller.source;
    app.reporter = app
        .controller
        .setup
        .getReporter();

    //add a listener to the reporter
    app.reporter
        //.setCategories("all")
        .addListener(function (msgObj) {
            printMessage(msgObj);
        });

    //report that the modules have been loaded
    app.reporter.info(
        `Bootstrap Modules Loaded`
    );

    //setup IOC controller
    app.controller
        .setup
        .setContainer(app.container)
        .setAbstractTree(dtree)
        .setGlobal({
            "require": require
            , "process": process
            , "Promise": Promise
        })
        .setSourceList(sourceList)
        .setConsumerReferences(consumerRefs)
    ;

    //add the ioc reporter as a dependency
    app.dependency.upsert(
        ".reporter"
        , app.reporter
    );

    //report setup done
    app.reporter.info(
        `System Setup Complete`
    );
}
/**
* @function
*/
function printMessage(message) {
    message.details = message.details || {};
    var timestamp = message.timestamp.toPrecision(10)
    , category = message.category
    , level = message.details.level || 0
    , id = message.details.id || "0".repeat(12)
    , padding = " ".repeat(level * 4)
    ;
    console.log(
        `${level}: ${padding}${id}(${timestamp})[${category}]: ${message.message}`
    );
}
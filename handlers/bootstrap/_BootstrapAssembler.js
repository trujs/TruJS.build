/**
*
* @factory
*/
function _BootstrapAssembler (
    promise
    , fs_fileInfo
    , is_object
    , defaults
    , errors
) {

    /**
    * @worker
    */
    return function BootstrapAssembler (
        entry
        , assets
    ) {
        try {
            var data = "", file
            , path = entry.config.fileName
            , templateDefaults;

            assets
            .forEach(function forEachAsset(asset) {
                data+= `${asset.data}\n`;
                if (!templateDefaults && asset.docs) {
                    templateDefaults = extractTemplate(asset.docs);
                }
            });

            file = fs_fileInfo(
                path
                , data
            );

            entry.templateDefaults = templateDefaults;

            return promise.resolve([file]);
        }
        catch (ex) {
            return promise.reject(ex);
        }
    };

    /**
    * Looks for the @template section in the documentation
    * @function
    */
    function extractTemplate(docs) {
        var template, docTemplate;

        docs.every(function everyDocEntry(doc) {
            if (doc.hasOwnProperty("template")) {
                docTemplate = doc.template;
                return false;
            }
            return true;
        });

        //convert the doc entries into an object
        if (is_object(docTemplate)) {
            template = {};

            docTemplate
            .variable
            .forEach(function forEachTemplateVar(tempVar) {
                if (!!tempVar.desc) {
                    template[tempVar.name] =
                        tempVar.type !== "string" || tempVar.desc[0] === "\""
                        ? JSON.parse(tempVar.desc)
                        : tempVar.desc
                    ;
                }
            });
        }

        return template;
    }
}
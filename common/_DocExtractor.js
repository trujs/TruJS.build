/**
* Extracts the documentation from the asset data and adds two properties to the asset, `[docs]` which is an array of the document entries extractged and `dataNoDoc` which is the asset data minus the documentation entries
* @factory
* @interface iDocEntry
*   @property {string} description The text before the first @ tag
*   @property {object} attributes The
* @interface iDocTag
*   @property {number} indent
*   @property {string} tag
*   @property {string} type
*   @property {string} name
*   @property {string} description
*   @property
*/
function _DocExtractor(
    is
    , utils_apply
    , defaults
) {
    /**
    * A regexp pattern to pull JSDoc formatted comments from a javascript file
    * @property
    */
    var JS_DOC_PATT = /\/[*]{2}((?:[^*]|[*](?!\/))+)[*]\//gms
    /**
    * A regexp pattern to split the entry into lines
    * @property
    */
    , LN_SPLIT_PATT = /\r?\n/gm
    /**
    * A regexp pattern pulling out @ tags
    * @property
    */
    , AT_TAG_PATT = /^[^@]*(?:(?<!\\)@[^\s])[^@]+/
    /**
    * A regexp pattern for splitting an @ tag
    * @property
    */
    , AT_TAG_PARTS_PATT = /([^@]*)@([A-z_-]+)(?:\s+\{([A-z]+)\})?(?:\s+((?:\[[^\]]+\])|(?:\{[^\}]+\})|(?:[^\s]+)))?(\s+.+)?$/ms
    /**
    * A regexp pattern for splitting an @ tag
    * @property
    */
    , DESC_CLEAN_PATT = /^(?:[ \*\-]*)?(.*?)(?:[ \*\-]*)$/
    ;

    /**
    * @worker
    */
    return function DocExtractor(asset) {
        if (
            defaults.jsDocExt.indexOf(asset.path.ext) !== -1
        ) {
            extractFromJs(asset);
        }
    };

    /**
    * A JavaScript specific extractor
    * @function
    */
    function extractFromJs(asset) {
        var entries = []
        , dataNoDoc = is.string(asset.data)
            && asset.data.replace(
                JS_DOC_PATT
                , function replaceDoc(match, contents) {
                    entries.push(contents);
                    return "";
                }
            )
        //convert the
        , docEntries = convertDocEntries(
            entries
        )
        ;

        addToAsset(
            asset
            , docEntries
        );
    }
    /**
    * @function
    */
    function convertDocEntries(entries) {
        var docEntries = [];

        entries.forEach(function forEachEntry(entry) {
            docEntries.push(
                convertDocEntry(entry)
            );
        });

        return docEntries;
    }
    /**
    * Converts the document entry text into an instance of `{iDocEntry}`
    * @function
    */
    function convertDocEntry(entry) {
        var atTags = []
        //remove the @ tags from the entry, the remaining is description
        , desc = stripAtTags(entry, atTags)
        //convert the tags into instances of `{iDocTag}`
        , convertedTags = convertTags(atTags)
        //get the
        , properties = createTagTree(convertedTags)
         //create the instance of `{iDocEntry}`
        , docEntry = {
            "description": cleanDescription(desc)
        };
        //pply the properties to the doc entry
        utils_apply(properties, docEntry);

        return docEntry;
    }
    /**
    * Strips the @ tags from the entry and returns the description. Additionally, it adds the @ tags to the `atTags` array.
    * @function
    */
    function stripAtTags(entry, atTags) {
        var lines = entry.split(LN_SPLIT_PATT)
        , isTags = false
        , desc = ""
        , lastIndx;

        lines.forEach(function forEachLine(line) {
            if (line.match(AT_TAG_PATT)) {
                lastIndx = atTags.push(
                    line
                ) - 1;
                isTags = true;
            }
            else {
                if (!isTags) {
                    desc+= line;
                }
                else if(!!line) {
                    atTags[lastIndx]+= `\n${line}`;
                }
            }
        });

        return desc;
    }
    /**
    * Convert the @ tags into an array of instances of `{iDocTag}`
    * @function
    */
    function convertTags(atTags) {
        var lastTag;

        return atTags.map(function mapTag(tag) {
            //parse the tag
            var parts = tag.match(AT_TAG_PARTS_PATT), tagObj;
            //create the tag object
            tagObj = {
                "indent": !!parts[1] && parts[1].length || 0
                , "tag": parts[2]
            };

            !!parts[3] && (tagObj.type = parts[3]);
            !!parts[4] && (tagObj.name = parts[4]);
            !!parts[5] && (tagObj.desc = parts[5]);

            //clean the description
            if (!!tagObj.desc) {
                tagObj.desc = tagObj.desc
                    .split(LN_SPLIT_PATT)
                    .map(function mapLine(line,indx) {
                        return line.replace(DESC_CLEAN_PATT, "$1");
                    })
                    .filter(function filterLines(line) {
                        if (is.empty(line)) {
                            return false;
                        }
                        return true;
                    })
                    .join("\n");
            }
            //set the last tag for the next loop
            lastTag = tagObj

            return tagObj;
        });
    }
    /**
    * Cleans up the description
    * @function
    */
    function cleanDescription(desc) {
        var match = desc.match(DESC_CLEAN_PATT);
        if (!!match) {
            return match[1];
        }
        return "";
    }
    /**
    * @function
    */
    function createTagTree(convertedTags) {
        var tagTree = {}
        , lastTag;

        convertedTags.forEach(function forEachTag(tagObj) {
            var curTag = tagTree;
            //if there is a last tag,
            //check the indent to see if this is a child
            if (!!lastTag && tagObj.indent > lastTag.indent) {
                curTag = lastTag;
            }
            //otherwise set the last tag
            else {
                lastTag = tagObj;
            }

            //see if this tag has been used before
            if (curTag.hasOwnProperty(tagObj.tag)) {
                if (!is.array(curTag[tagObj.tag])) {
                    curTag[tagObj.tag] = [];
                }
                curTag[tagObj.tag].push(tagObj);
            }
            else {
                curTag[tagObj.tag] = tagObj;
            }
        });

        return tagTree;
    }
    /**
    * @function
    */
    function addToAsset(asset, docEntries) {
        asset[defaults.docEntryPropertyName] =
            docEntries;
    }
}
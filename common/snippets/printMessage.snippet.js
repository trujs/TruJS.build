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
        level + ": "+ padding
        + id
        + "(" + timestamp + ")"
        + "[" + category + "]:"
        + message.message
    );
}
/*
    This module maintains logger for this application and it's components
    Logging is sent to console (with timestamp) and Logges (without timestamp)
    as plain text.
 */

var winston = require('winston'),
    logger;
    
var timeZone=function(){
    return new Date();
}

logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({json: false, timestamp: true, level: "debug", timestamp: timeZone})
    ],
    exceptionHandlers : [
        new (winston.transports.Console)({json: false, timestamp: true, level: "debug", timestamp: timeZone})
    ],
    exitOnError : false
});

module.exports = logger;

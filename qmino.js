/**
 * Created by Ewout on 7/09/2015. Similar to an ajax appender, except that it sends logging information
 * to a logging back-end when receiving logs of a configurable level. When a message exceeds the level threshold,
 * it is sent along with a configurable amount of previous logging messages (of any level) that came before the
 * threshold exceeding one.
 */
Log4js.QminoAppender = function (loggingHost, path, ajaxThreshold, bufferSize) {
    this.loggingHost = loggingHost;
    this.path = path;
    this.ajaxThreshold = ajaxThreshold;
    this.bufferSize = bufferSize;
    this.buffer = [];
    this.layout = new Log4js.JSONLayout();
};

Log4js.QminoAppender.prototype = Log4js.extend(new Log4js.Appender(), {

    doAppend: function (loggingEvent) {
        if (this.buffer.length >= this.bufferSize) {
            this.buffer.shift();
        }
        this.buffer.push(loggingEvent);
        if (loggingEvent.level.level >= this.ajaxThreshold.level) {
            var gelfFactory = new Log4js.GELFFactory(this.guid());
            var gelfObjects = gelfFactory.createGelfObjects(this.buffer);
            this.sendGelfObjects(gelfObjects);
            this.buffer = [];
        }
    },
    guid: function () {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }

        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    },
    sendGelfObjects: function (gelfObjects) {
        for (var i = 0; i < gelfObjects.length; i++) {
            var http = new XMLHttpRequest();
            http.open("POST", this.loggingHost + this.path, true);
            http.onreadystatechange = function () {
                //TODO: do stuff.
            }
            http.send(JSON.stringify(gelfObjects[i]));
        }
    },
    doClear: function () {
        this.buffer = [];
    }
});

Log4js.GELFFactory = function (uuid) {
    this.uuid = uuid;
}

Log4js.GELFFactory.prototype = {

    createGelfObjects: function (loggingEvents) {
        var gelfObjects = new Array();
        for (var i = 0; i < loggingEvents.length; i++) {
            gelfObjects.push(this.createGelfObject(loggingEvents[i], this.uuid, i));
        }
        return gelfObjects;
    },
    createGelfObject: function (loggingEvent, uuid, sequence) {
        var gelf = new Log4js.GELF();

        gelf.setLevel(loggingEvent.level);
        gelf.short_message = loggingEvent.message;

        if (loggingEvent.exception !== null && loggingEvent.exception !== undefined) {
            gelf.full_message += gelf.short_message + "\n";
            gelf.full_message += loggingEvent.exception.stack;
        }

        gelf._log_uuid = uuid;
        gelf._sequence_id = sequence;
        return gelf;
    }

}

Log4js.GELF = function (loggingEvent, uuid, sequence) {
    this.level = "";
    this.short_message = "";
    this.full_message = "";
    this.version = "1.1";

    this._log_uuid = "";
    this._sequence_id = 0;
}

Log4js.GELF.prototype = {

    setLevel: function (log4jsLevel) {
        if (log4jsLevel.levelStr == "FATAL") {
            this.level = 1;
        }
        if (log4jsLevel.levelStr == "ERROR") {
            this.level = 3;
        }
        if (log4jsLevel.levelStr == "WARN") {
            this.level = 4;
        }
        if (log4jsLevel.levelStr == "INFO") {
            this.level = 6;
        }
        if (log4jsLevel.levelStr == "DEBUG" || log4jsLevel.levelStr == "TRACE") {
            this.level = 7;
        }
    }
}
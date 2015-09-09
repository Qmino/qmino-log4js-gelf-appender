# qmino-log4js-gelf-appender

This project contains an appender for log4js. This is the appender we at Qmino use in order to perform client side logging using graylog.

The appender sends logs to graylog in the GELF format. The appender works as follows:

* It has a cache size which contains recent log messages (of any level)
* It has a configurable logging level threshold.
* When something is logged with a logging level greater or equal than the configured logging level threshold, the appender sends the logging cache to graylog and clears the cache.

The following fields are added to the GELF format in order to maintain the order of the logging messages and in order to differentiate between the logging caches sent to graylog:
* log_uuid: this field identifies a logging cache.
* sequence_id: this field denotes the order of a logging message inside a logging cache.

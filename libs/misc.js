var util = require('util');

/**
 * Get Connection URL
 *
 * @param  {Object} arguments. [h] host, [U] user, [P] password, [s] database, [p] port
 *
 * @return {String} DB connection string
 */
exports.getMongoConnectionURL = function(connObj) {

    if (typeof connObj !== 'object' ||
        undefined === connObj ||
        undefined === connObj.host ||
        undefined === connObj.port) {

        // use default values
        return "";
    }

    // mongodb://[username:password@]host1[:port1][,host2[:port2],...[,hostN[:portN]]][/[database][?options]]
    var connectionString = "";

    // both should be presented
    if (undefined !== connObj.user && undefined !== connObj.password && connObj.user.length > 0 && connObj.password.length > 0) {
        connObj.user = connObj.user + ":";
        connObj.password = connObj.password + "@";
    } else {
        connObj.user = '';
        connObj.password = '';
    }

    connectionString = util.format('mongodb://%s%s%s:%s/%s', connObj.user, connObj.password, connObj.host, connObj.port, connObj.dbname);

    return connectionString;
};

var misc   = require("./misc");
var client = require('mongodb').MongoClient;
var debug  = require('debug');

var error  = debug('app:error');
var log    = debug('app:log');
debug.log  = console.info.bind(console);

var Yandex = exports.Controller = function(nconf) {

    this.nconf       = nconf;
    this.dbclient    = null;
    this.collection  = null;
};

Yandex.prototype.connect = function(cb) {
    var self = this;

    if (null === self.dbclient) {

        client.connect(misc.getMongoConnectionURL({
                                "user": self.nconf.get("db-user"),
                                "password": self.nconf.get("db-password"),
                                "host": self.nconf.get("db-host"),
                                "port": self.nconf.get("db-port"),
                                "dbname": self.nconf.get("db-name")}), function(err, db) {
            if (err) {
                error("Cannot update migration value in DB");
                cb(err, false);
            } else {
                log("Mongo connected");
                self.dbclient = db;
                self.collection = self.dbclient.collection(self.nconf.get("db-collection"));
                cb(null, true);
            }
        });
    }
};


Yandex.prototype.loadKeywords = function(cb) {
    var self = this;

    if(null === self.dbclient) {
        this.connect(function(err, status) {
            if(!err) {
                self._loadKeywords(cb);
            }
        });
    } else {
        self._loadKeywords(cb);
    }
};

Yandex.prototype._loadKeywords = function(cb) {
    var self = this;

    log("loadKeywords");
    cb(null, true);
};

Yandex.prototype.done = function() {

    var self = this;

    log("Done");
    if (null !== self.dbclient) {
        self.dbclient.close();
    }

};

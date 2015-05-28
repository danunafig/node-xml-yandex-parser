var misc  = require("./misc");
mysql     = require('mysql'),
debug     = require('debug'),
parser    = require('xml2json'),
http      = require('http'),
util      = require('util'),
urlencode = require('urlencode'),
crc       = require('crc');

var error  = debug('app:error');
var log    = debug('app:log');
debug.log  = console.info.bind(console);

var Yandex = exports.Controller = function(nconf) {

    this.nconf      = nconf;
    this.connection = null;

    //this.requets = "http://yandex.ru/search/xml?user=%s&key=%s&query=%D0%98%D0%B7%D0%BC%D0%B5%D1%80%D0%B5%D0%BD%D0%B8%D0%B5+%D0%BA%D0%B8%D1%81%D0%BB%D0%BE%D1%82%D0%BD%D0%BE%D1%81%D1%82%D0%B8+pH&lr=213&l10n=ru&sortby=rlv&filter=none&groupby=attr%3D%22%22.mode%3Dflat.groups-on-page%3D5.docs-in-group%3D1";
    this.requets = "http://yandex.ru/search/xml?user=%s&key=%s&query=%s&lr=%d&l10n=ru&sortby=rlv&filter=none&groupby=attr%3D%22%22.mode%3Dflat.groups-on-page%3D%d.docs-in-group%3D1";

};


Yandex.prototype.connect = function(cb) {
    var self = this;

    if (null === self.connection) {

        self.connection = mysql.createConnection({
            host     : self.nconf.get("db-host"),
            user     : self.nconf.get("db-user"),
            password : self.nconf.get("db-password"),
            database : self.nconf.get("db-name")
        });

        self.connection.connect(function(err) {

            if (err) {
                error("Cannot update migration value in DB");
                cb(err, false);
            } else {
                log("DB connected");
                cb(null, true);
            }
        });
    }
};


Yandex.prototype.loadKeywords = function(cb) {
    var self = this;

    if(null === self.connection) {
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

    self.connection.query('select id, keyword, region from keywords where enabled = 1 order by updatedAt ASC limit ?',
        [self.nconf.get("limits:requestsPerHour")], function(err, results) {

        if(err) {
            error("_loadKeywords", err);
            return cb(err, []);
        } else {
            log("keywords are loaded");
            return cb(null, results);
        }
    });
};

Yandex.prototype.parseKeywords = function(keywords, cb) {
    var self = this;

    var i       = 1;
    var j       = 0;
    var total   = (keywords.length * self.nconf.get("yandex:onpage"));

    keywords.forEach(function(key) {

        var query = util.format(self.requets, self.nconf.get("yandex:user"), self.nconf.get("yandex:key"), urlencode(key.keyword), key.region, self.nconf.get("yandex:onpage"));

        http.get(query, function(response) {

            log("Parsing...", "[" + key.id + "] " + key.keyword);

            var body = '';
            response.on('data', function(d) {
                body += d;
            });
            response.on('end', function() {

                // Data reception is done, do whatever with it!
                var json =  JSON.parse(parser.toJson(body));
                var results = json["yandexsearch"]["response"]["results"]["grouping"]["group"];
                j = 0;

                results.forEach(function(el) {
                    j++;
                    var k = {"keyword_id": key.id, "position": j, "domain": crc.crc32(self.parseURL(el.doc.domain))};
                    console.log(self.parseURL(el.doc.domain), crc.crc32(self.parseURL(el.doc.domain)));

                    self.logKeyword(k, function(err, status) {
                        if(err) {
                            return cb(err.message, null);
                        } else {
                            if(i == total) {
                                cb(null, "done");
                            }
                            i++;
                        }
                    })
                });
            });

        }).on('error', function(e) {
            return cb(e.message, null);
        });
    });
};

Yandex.prototype.logKeyword = function(key, cb) {
    var self = this;

    self.connection.query('insert into yandex set ?', key, function(err, status) {

        if(err) {
            error("logKeywords", err);
            return cb(err, null);
        } else {
            log(status);
            return cb(null, status);
        }
    });
};

Yandex.prototype.track = function(err, status, result) {

    var self = this;

    if(err) {

        error(err);
        if (null !== self.connection) {
            self.connection.end();
            process.exit(1);
        }

    } else if(status === "done") {

        log("Done");
        if (null !== self.connection) {
            self.connection.end();
            process.exit(0);
        }
    } else {

        if (null !== self.connection) {
            self.connection.end();
            process.exit(1);
        }

    }


};


Yandex.prototype.parseURL = function(url) {

    if((url.match(/\./g)||[]).length > 1) {
        return url.replace(/^www(.?)\./g, "");
    } else {
        return url;
    }
};

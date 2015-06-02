var async = require("async");
/**
 * YandexController
 *
 * @description :: Server-side logic for managing yandexes
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

    /**
     * Get keywords stats
    {
        "where": {
            "region_id": 213,
            "period": ["day","week","month"]
            "client_id": 1
        },
        "limit": 100
    }
    */
    getStats: function(req, res) {

        var self = this;
        self.params = req.params.all();
        self.region_id = parseInt(self.params.where.region_id) || 0;
        self.client_id = parseInt(self.params.where.client_id) || 0;

        var r  = [self._getD];

        if(undefined !== self.params &&
            undefined !== self.params.where &&
            undefined !== self.params.where.period) {

            if(self.params.where.period.indexOf("day") >= 0) {
                r.push(self._getD1);
            }

            if(self.params.where.period.indexOf("week") >= 0) {
                r.push(self._getD7);
            }

            if(self.params.where.period.indexOf("month") >= 0) {
                r.push(self._getD30);
            }
        }

        if(r.length > 0 && self.client_id > 0) {


            self._getClientDomains(function(err, domains) {

                if(err || undefined === domains[0]) {
                    return res.serverError(err);
                } else {
                    self.domains = domains[0].domainCRC32;

                    async.parallel(r,
                    function(err, results) {
                        if(!err) {
                            return res.json(results);
                        } else {
                            return res.serverError(err);
                        }
                    });
                }
            })

        } else {
            return res.json([]);
        }

    },

    _getD: function(callback) {
        var self = this;

        self._getYandexStats(1, function(err, results) {
            callback(err, results);
        })
    },

    _getD1: function(callback) {
        var self = this;

        self._getYandexStats(2, function(err, results) {
            callback(err, results);
        })
    },

    _getD7: function(callback) {
        var self = this;

        self._getYandexStats(7, function(err, results) {
            callback(err, results);
        })
    },

    _getD30: function(callback) {
        var self = this;

        self._getYandexStats(30, function(err, results) {
            callback(err, results);
        })
    },

    _getYandexStats: function(days, cb) {
        var self = this;

        var region = (self.region_id > 0) ? " A.region = "+self.region_id+" AND " : "";

        Yandex.query("SELECT B.keyword_id, A.keyword, A.region, MIN(B.position) as y, count(*) as ct \
                    FROM yandex B \
                    LEFT JOIN c2k C ON B.keyword_id = C.keyword_id \
                    LEFT JOIN keywords A ON B.keyword_id = A.id \
                    WHERE "+ region +" C.client_id = "+self.client_id+" AND \
                    A.enabled = 1 AND \
                    B.timedAt = '"+self._getDate(days)+"' AND \
                    B.domain IN ("+self.domains+") \
                    GROUP BY B.keyword_id", function(err, results) {

                cb(err, results);

        });
    },

    _getClientDomains: function(cb) {
        var self = this;

        Yandex.query("SELECT domainCRC32 FROM clients WHERE id = " + self.client_id, function(err, results) {

                cb(err, results);

        });
    },

    _getDate: function(days) {

        var today = new Date();
        today.setDate(today.getDate() - days);
        var dd = today.getDate();
        var mm = today.getMonth() + 1; //January is 0!
        var yyyy = today.getFullYear();

        if(dd<10) {
            dd='0'+dd
        }

        if(mm<10) {
            mm='0'+mm
        }

        return yyyy+"-"+mm+"-"+dd;
    }


};


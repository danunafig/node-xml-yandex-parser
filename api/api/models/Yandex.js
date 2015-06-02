/**
* Yandex.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

    migrate: "safe",
    connection: "yandexMysqlServer",
    attributes: {
        keyword_id: {
            type: 'integer'
        },
        position: {
            type: 'integer'
        },
        domain: {
            type: 'integer'
        },
        timedAt: {
            type: 'date'
        }
    },

    getStats: function(options, cb) {
        cb(null, 201);

    //select A.id, A.keyword, A.region, MIN(B.position) as position FROM keywords A LEFT JOIN yandex B ON A.id = B.keyword_id WHERE B.timedAt = '2015-05-28' AND B.domain = 3175629442 GROUP BY A.id

    }
};


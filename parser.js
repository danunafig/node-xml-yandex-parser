var nconf  = require('nconf');
var ctr    = require("./libs/yandex").Controller;

// Setup nconf to use (in-order):
//   1. Command-line arguments
//   2. Environment variables
//   3. config file in:
nconf.argv()
.env()
.file('custom', './configs/glb.conf.json');

if (nconf.get('help')) {
   console.log("\nUsage:\tparser [options] [arguments]\n" +
    "Options: \n" +
    "\t--db-port db port \n" +
    "\t--db-port db port \n" +
    "\t--db-name db name \n" +
    "\t--db-collection collection name \n" +
    "\t--yandex:user Yandex User \n" +
    "\t--yandex:key Yandex Key \n" +
    "\t--yandex:lr Region \n" +
    "\t--yandex:l10n Language \n" +
    "\t--yandex:sortby Sorting \n" +
    "\t--yandex:filter Filtering \n" +
    "\t--yandex:groupby Grouping\n");

    process.exit(0);
}

// Framework core lib
var ya = new ctr(nconf);

ya.loadKeywords(function(error, results) {

    if(results.length > 0) {

        ya.parseKeywords(results, function (err, status, result) {

            ya.track(err, status, result);

        });
    } else {
        ya.track("Nothing to parse", "done", null);
    }
});


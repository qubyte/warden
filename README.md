# warden

A wrapper for [Panopticon](https://github.com/Wizcorp/panopticon) that makes adding measurements to your codebase simple and efficient.

## Setup

You should require warden and call it on both the cluster master and cluster workers of your service. For example:

```javascript
var cluster = require('cluster');
var warden = require('warden');

// Calling setup before cluster logic is an easy way to call it on all processes.
warden.setup([/* intervals */], { /* Panopticon config */ });

// warden.setup should be run on all processes. Below is how I handle cluster.
if (cluster.isMaster && process.env.NODE_ENV === 'production') {
    require('./master.js'); // Handles all master logic.
} else {
    require('./worker.js'); // Entry point to the service logic.
}
```

The configuration argument is the same as that of Panopticon, but you should omit the `interval` field since this is overridden by the second argument.

## Usage

Once `warden.setup` has been called, you can simply require warden in any module you want to collect measurements in. The warden has the same measurement methods as Panopticon, and you can even add your own. See the [Panopticon documentation](https://github.com/Wizcorp/panopticon#panopticonsamplepath-id-n) for the logger methods. For example, an express middleware that measures response time could look like:

```javascript
var warden = require('warden');

module.exports = function (req, res, next) {
    'use strict';

    var t0 = process.hrtime();

    res.once('finish', function () {
        // Δt in high resolution. Panopticon has a timedSample method that uses these.
        var t1 = process.hrtime(t0);

        // For grouping related measurements.
        var path = ['webservice', req.route.path, req.route.method];

        warden.timedSample(path, 'responseTime' t1);
    });

    next();
}
```

## Delivery

After each interval elapses, aggregated data is emitted on the `delivery` event of warden. This emission only happens on master, so you must handle the data in your master process. The form of the data can be customized during setup. See [here](https://github.com/Wizcorp/panopticon#transformer) for information.

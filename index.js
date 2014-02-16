var EventEmitter = require('events').EventEmitter;
var Panopticon = require('panopticon');

var panoptica;
var specification;

// This changes to true when the module setup function has been run.
var isSetup = false;

// Warden is an event emitter.
exports = module.exports = new EventEmitter();

// Expose the setup status of warden in a read-only form.
Object.defineProperty(exports, 'isSetup', {
	get: function () {
		'use strict';

		return isSetup;
	},
	enumerable: true,
	configurable: false
});


/**
 * Make a shallow copy of an options object, inserting an interval parameter. If options are added
 * to the Panopticon constructor later, then this covers it.
 *
 * @param  {Object} object Object to be copied.
 * @return {Object}        Object copy.
 */

function makeOptions(interval) {
	'use strict';

	var copiedObject = { interval: interval };

	var keys = Object.keys(specification);

	for (var i = 0, len = keys.length; i < len; i++) {
		var key = keys[i];

		copiedObject[key] = copiedObject[key];
	}

	return copiedObject;
}


/**
 * Given an interval, this function returns a new Panopticon instance for it. This function assumes
 * that the specification has been set, implying that setup has been called.
 *
 * @param  {Number}     interval Interval time. In ms by default.
 * @return {Panopticon}          A Panopticon instance.
 */

function constructPanopticon(interval) {
	'use strict';

	var options = makeOptions(interval);
	var panopticon = new Panopticon(options);

	panopticon.on('delivery', function (data) {
		exports.emit('delivery', data);
	});

	return panopticon;
}


/**
 * Proxy a sample `methodName` from exports to all Panopticon instances.
 *
 * @param {String} methodName Name of a Panopticon sampling method.
 */

function mapMethod(methodName) {
	'use strict';

	exports[methodName] = function () {
		if (!isSetup) {
			exports.emit('error', new Error('Warden setup must be run before it receives data.'));
			return;
		}

		for (var i = 0, len = panoptica.length; i < len; i++) {
			Panopticon.prototype[methodName].apply(panoptica[i], arguments);
		}
	};
}


/**
 * Initialize warden with a common Panopticon specification (without interval), and an array of
 * intervals.
 *
 * @param {Object}   spec        A Panopticon specification, without the interval field.
 * @param {Number[]} [intervals] An array of interval values.
 */

exports.setup = function (spec, intervals) {
	'use strict';

	// Store the specification.
	specification = spec;

	// Generate an initial set of intervals.
	if (Array.isArray(intervals)) {
		panoptica = intervals.map(constructPanopticon);
	} else {
		panoptica = [];
	}

	// The module has been initialized.
	isSetup = true;
};


/**
 * After the setup function has been run, new intervals may still be added.
 *
 * @param {Number} interval A time interval for the new Panopticon instance.
 */

exports.add = function (interval) {
	'use strict';

	panoptica.push(constructPanopticon(interval));
};


/**
 * If a new sampling method is added, map a new exports method to the panoptica.
 *
 * @param {String}   methodName  Name of the logger method.
 * @param {Function} loggerClass Logger constructor.
 * @param {Function} validator   Data validation function.
 */

exports.registerMethod = function (methodName, loggerClass, validator) {
	'use strict';

	// Register the new method with Panopticon.
	Panopticon.registerMethod(methodName, loggerClass, validator);

	// Map the method from exports of this module to each Panopticon instance.
	mapMethod(methodName);
};


/**
 * This should be used when retiring a process. It unregisters events that would otherwise stop the
 * process from shutting down.
 */

exports.stop = function () {
	'use strict';

	exports.emit('stopping');

	exports.removeAllListeners('delivery');
	exports.removeAllListeners('stopping');

	for (var i = 0, len = panoptica.length; i < len; i++) {
		panoptica[i].stop();
	}
};


// Map the panopticon sampling methods to this module, so that all instances receive updates.
Panopticon.getLoggerMethodNames().forEach(mapMethod);

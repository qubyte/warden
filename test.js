'use strict';
var Panopticon = require('panopticon');

/**
 * Setup requires a fresh warden.
 *
 * @param  {Function} callback Callback function.
 */
exports.setUp = function (callback) {
	this.warden = require('./');
	callback();
};


/**
 * Since warden is very simple (just a single file), it can be easily unloaded by deleting it from
 * the require cache.
 *
 * @param {Function} callback Callback function.
 */

exports.tearDown = function (callback) {
	if (this.warden.isSetup) {
		this.warden.stop();
	}

	delete require.cache[require.resolve('./')];
	callback();
};


exports['Warden should have Panopticon built in sampler methods.'] = function (test) {
	var warden = this.warden;
	var loggerMethodNames = Panopticon.getLoggerMethodNames();

	test.expect(loggerMethodNames.length);

	loggerMethodNames.forEach(function (methodName) {
		test.ok(warden[methodName], 'Panopticon method missing from warden: ' + methodName);
	});

	test.done();
};


exports['Warden should have Panopticon extended sampler methods.'] = function (test) {
	var warden = this.warden;

	/* istanbul ignore next */
	warden.registerMethod('TestLogger', function () {});

	test.expect(1);
	test.ok(warden.TestLogger);
	test.done();
};


exports['Warden should initialize Panopticon instances.'] = function (test) {
	test.expect(1);

	this.warden.setup({}, [10]);

	this.warden.on('delivery', function (data) {
		test.ok(data);
		test.done();
	});
};


exports['Warden should accept addition of new intervals after setup.'] = function (test) {
	test.expect(1);

	this.warden.setup({ startTime: Date.now() });
	this.warden.add(100);
	this.warden.inc([], 'test', 100);

	this.warden.on('delivery', function (delivery) {
		test.equal(delivery.data.master.test.value.val, 1);
		test.done();
	});
};


exports['Warden should emit an error if setup not run yet.'] = function (test) {
	test.expect(1);

	this.warden.on('error' , function (error) {
		test.equal(error.message, 'Warden setup must be run before it receives data.');
		test.done();
	});

	this.warden.inc([], 'test', 100);
};

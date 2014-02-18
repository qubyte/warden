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
	/* istanbul ignore next */
	this.warden.registerMethod('TestLogger', function () {});

	test.expect(1);
	test.ok(this.warden.TestLogger);
	test.done();
};


exports['Warden should throw if no intervals are given.'] = function (test) {
	var warden = this.warden;

	test.throws(function () {
		warden.setup(null, {});
	}, Error);

	test.done();
};


exports['Warden should throw if an empty interval array is given.'] = function (test) {
	var warden = this.warden;

	test.throws(function () {
		warden.setup([], {});
	}, Error);

	test.done();
};


exports['Warden should throw if non numeric intervals are given.'] = function (test) {
	var warden = this.warden;

	test.throws(function () {
		warden.setup([1, 2, null, 4 ,5], {});
	}, Error);

	test.done();
};


exports['Warden should assume an empty object if no spec is given.'] = function (test) {
	this.warden.setup([1, 2, 3]);
	test.done();
};


exports['Warden should initialize Panopticon instances.'] = function (test) {
	test.expect(1);

	this.warden.setup([100], { startTime: Date.now() });
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

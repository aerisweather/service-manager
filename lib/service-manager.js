"use strict";
const _ = require('lodash');
var instance = null;

class ServiceManager {
	constructor(serviceFactories) {
		this._services = Object.keys(serviceFactories).
			reduce((services, name) =>  _.extend(services, {
				[name]: {
					factory: serviceFactories[name],
					instance: null
				}
			}), {});

		this._overridenServices = {};
	}

	/**
	 * @param {string} path Name of service, or dot-notated path to service property
	 * @param defaultVal
	 * @returns {*}
	 */
	get(path, defaultVal) {
		const parts = path.split('.');
		const name = _.first(parts);
		path = _.rest(parts).join('.');

		if (!this.exists(name)) {
			throw new Error('Service "' + name + '" is not defined');
		}

		// Make sure service is cached
		if (!this._services[name].instance) {
			this._services[name].instance = this._services[name].factory(this);
		}

		// Return cached service
		const instance = this._services[name].instance;
		return path.length ?
			_.get(instance, path, defaultVal) : (instance === undefined ? defaultVal : instance);
	}

	set(name, service) {
		if (this.exists(name)) {
			throw new Error('Service "' + name + '" already exists. ' +
			'Use ServiceManager#override to override and existing service.');
		}

		this._services[name] = {
			factory: _.constant(service),
			instance: service
		};
	}

	exists(name) {
		return name in this._services;
	}

	override(name, service) {
		// Keep a reference to the original service,
		// so we can restore it later.
		// Note this will be null if no service was defined
		this._overridenServices[name] = this._services[name] || null;

		this._services[name] = {
			factory: _.constant(service),
			instance: service
		};
	}

	/**
	 * Override a service by recreating the same
	 * service using it's original factory function.
	 *
	 * Use `restore` to reset the service to it's original value.
	 *
	 * @param {string} name
	 */
	recreate(name) {
		this.override(name, this._services[name].factory(this));
	}

	reinitialize() {
		_.values(this._services)
			.forEach(serviceDef => serviceDef.instance = null);
	}

	/**
	 * Restore overridden services.
	 * Useful for resetting state after tests.
	 */
	restore() {
		_.each(this._overridenServices, (overridenService, name) => {
			if (overridenService === null) {
				// Remove the service, if not previously existed
				delete this._services[name];
			}
			else {
				// Restore the original service
				this._services[name] = overridenService;
			}
		});
	}
}


ServiceManager.instance = function() {
	return instance || (ServiceManager.initialize());
};

var isInitialized = false;
ServiceManager.initialize = function(opt_services, allowOverride) {
	if (isInitialized && !allowOverride) {
		throw new Error('Service manager is already initialized');
	}

	instance = new ServiceManager(opt_services || {});
	isInitialized = true;
};

module.exports = ServiceManager;
const ServiceManager = require('../../lib/service-manager');
const assert = require('assert');
const sinon = require('sinon');

describe('ServiceManager', function() {

	describe('get', function() {

		it('should create instances from a factory', function() {
			const serviceManager = new ServiceManager({
				fooService: () => ({ foo: 'bar' })
			});

			assert.deepStrictEqual(serviceManager.get('fooService'), { foo: 'bar' });
		});

		it('should not create instances until they are retrieved the first time', function() {
			const fooServiceFactory = sinon.spy(() => ({ foo: 'bar' }));
			new ServiceManager({
				fooService: fooServiceFactory
			});

			assert.strictEqual(fooServiceFactory.callCount, 0);
		});

		it('should not invoke a factory more than once', function() {
			const fooServiceFactory = sinon.spy(() => ({ foo: 'bar' }));
			const serviceManager = new ServiceManager({
				fooService: fooServiceFactory
			});

			assert.strictEqual(fooServiceFactory.callCount, 0);

			serviceManager.get('fooService');
			serviceManager.get('fooService');
			serviceManager.get('fooService');

			assert.strictEqual(fooServiceFactory.callCount, 1, 'only calls factory once');
		});

		it('should pass the service manager to the factory', function() {
			const serviceManager = new ServiceManager({
				fooVal: () => 'bar',
				fooService: sm => ({ foo: sm.get('fooVal') })
			});

			assert.deepStrictEqual(serviceManager.get('fooService'), { foo: 'bar' });
		});

		it('should get nested properties', function() {
			const serviceManager = new ServiceManager({
				config: () => ({
					foo: 'bar'
				})
			});

			assert.strictEqual(serviceManager.get('config.foo'), 'bar');
		});

		it('should use default values for undefined services', function() {
			const serviceManager = new ServiceManager({
				config: () => ({
					foo: 'bar'
				})
			});

			assert.strictEqual(serviceManager.get('config.quux', 'qaz'), 'qaz');
		});

		it('should throw an error if the service is not defined', function() {
		  const serviceManager = new ServiceManager({
				foo: () => ({ foo: 'bar' })
			});

			assert.throws(() => serviceManager.get('notAService'));
		});

	});


	describe('override / restore', function() {

		it('should override uninitialized services', function() {
			const serviceManager = new ServiceManager({
				fooService: () => ({ foo: 'bar' })
			});

			serviceManager.override('fooService', { foo: 'mockBar' });

			assert.deepStrictEqual(serviceManager.get('fooService'), { foo: 'mockBar' });
		});

		it('should override already initialized services', function() {
			const serviceManager = new ServiceManager({
				fooService: () => ({ foo: 'bar' })
			});

			serviceManager.get('fooService');
			serviceManager.override('fooService', { foo: 'mockBar' });

			assert.deepStrictEqual(serviceManager.get('fooService'), { foo: 'mockBar' });
		});

		it('should restore back to uninitialized services', function() {
			const serviceManager = new ServiceManager({
				fooService: () => ({ foo: 'bar' })
			});

			serviceManager.override('fooService', { foo: 'mockBar' });
			serviceManager.restore();

			assert.deepStrictEqual(serviceManager.get('fooService'), { foo: 'bar' });
		});

		it('should restore back to initialized services', function() {
			const serviceManager = new ServiceManager({
				fooService: () => ({ foo: 'bar' })
			});

			serviceManager.get('fooService');
			serviceManager.override('fooService', { foo: 'mockBar' });
			serviceManager.restore();

			assert.deepStrictEqual(serviceManager.get('fooService'), { foo: 'bar' });
		});

	});

	describe('recreate / restore', function() {

		it('should override uninitialized services', function() {
			var counter = 0;
			const serviceManager = new ServiceManager({
				fooService: () => {
					const fooSvc = { id: counter };
					counter++;
					return fooSvc;
				}
			});

			serviceManager.recreate('fooService');
			assert.deepStrictEqual(serviceManager.get('fooService'), { id: 0 });
			assert.deepStrictEqual(serviceManager.get('fooService'), { id: 0 });
		});

		it('should override already initialized services', function() {
			var counter = 0;
			const serviceManager = new ServiceManager({
				fooService: () => {
					const fooSvc = { id: counter };
					counter++;
					return fooSvc;
				}
			});

			serviceManager.get('fooService');
			serviceManager.recreate('fooService');

			assert.deepStrictEqual(serviceManager.get('fooService'), { id: 1 });
			assert.deepStrictEqual(serviceManager.get('fooService'), { id: 1 });
		});

		it('should restore back to uninitialized services', function() {
			var counter = 0;
			const serviceManager = new ServiceManager({
				fooService: () => {
					const fooSvc = { id: counter };
					counter++;
					return fooSvc;
				}
			});

			serviceManager.recreate('fooService');
			serviceManager.restore();		// restored back to unitialized
			const fooService = serviceManager.get('fooService');  // initializes

			assert.deepStrictEqual(fooService, { id: 1 });
		});

		it('should restore back to initialized services', function() {
			var counter = 0;
			const serviceManager = new ServiceManager({
				fooService: () => {
					const fooSvc = { id: counter };
					counter++;
					return fooSvc;
				}
			});

			serviceManager.get('fooService');
			serviceManager.recreate('fooService');
			serviceManager.restore();

			assert.deepStrictEqual(serviceManager.get('fooService'), { id: 0 });
		});

	});

	describe('reinitialize', function() {

		it('should reset all services all services', function() {
			var fooCounter = 0, barCounter = 0;
			const serviceManager = new ServiceManager({
				fooService: () => {
					const fooSvc = { id: fooCounter };
					fooCounter++;
					return fooSvc;
				},
				barService: () => {
					const barSvc = { id: barCounter };
					barCounter++;
					return barSvc;
				}
			});

			serviceManager.get('fooService');	// creates foo 0

			serviceManager.reinitialize();

			assert.strictEqual(serviceManager.get('fooService').id, 1,
				'creates foo a second time');
			assert.strictEqual(serviceManager.get('barService').id, 0,
				'creates bar for the first time');
		});

	});

	describe('instance', function() {

		it('should return an already initialized instance', function() {
		  ServiceManager.initialize({
				fooService: () => ({ foo: 'bar' })
			});

			const serviceManager = ServiceManager.instance();

			assert.deepStrictEqual(serviceManager.get('fooService'), { foo: 'bar' });
		});

	});

});
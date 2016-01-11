ServiceManager
=======

A pretty simple service manager.

## Install

`ServiceManager` is hosted on npm:

```
npm install simple-service-manager
```

```
const ServiceManager = require('simple-service-manager');
```

## Usage
`ServiceManager` allows you to define application wide service objects. Services are defined using a factories config:

```js
ServiceManager.initialize({
	logger: () => new Logger({
	  filePath: '/var/log/my_app.log'
	});
});

const serviceManager = ServiceManager.instance();
const logger = serviceManager.get('logger');

logger.log("I'm a logger!");  // logs to /var/log/my_app.log
```

Service factories have access to the service manager, making it easy to wire components together:

```js
ServiceManager.initialize({
	config: () => ({
		logFile: '/var/log/my_app.log'
	}),
	logger: serviceManager => new Logger({
		logFile: serviceManager.get('config.logFile')
	}),
	myComponent: serviceManager => {
		const component = new Component();

		component.on('update', () => {
			sm.get('logger').log('component was updated!');
		});

		return component;
	}
});

const serviceManager = ServiceManager.instance();
const myComponent = serviceManager.get('myComponent');

myComponent.emit('update');
// logs "component was updated!" to /var/log/my_app.log
```

## Test Mocks

`ServiceManager` allows you to mock out services for testing. For example, let's say we want to mock out a database service in a test.

```js
const FooModel = require('../lib/model/foo');
const serviceManager = require('service-manager').instance();
const sinon = require('sinon');
const assert = require('assert');

describe('FooModel#update', () => {

  // Restore any overridden services after every test
  afterEach(() => serviceManager.restore());

  it('should update the database', () => {
    // mock out database
    const mockDb = {
      persist: sinon.spy((data) => Promise.resolve())
    };
    serviceManager.override('db', mockDb);
    
    const foo = new FooModel({ foo: 'bar' });
    foo.saveToDb();

	assert(mockDb.persist.calledWith({ foo: 'bar' }));
  });
});
```

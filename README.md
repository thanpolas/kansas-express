# Kansas Express

[Kansas][] API usage limiter Middleware for [Express][].

[![Build Status](https://secure.travis-ci.org/thanpolas/kansas-express.png?branch=master)](http://travis-ci.org/thanpolas/kansas-express)

## Install

Install the module with: `npm install kansas-express --save`

## Overview

Kansas Express offers two type of Middleware, [Consume](#the-consume-middleware) and [Manage](#the-manage-middleware).

## The Consume Middleware

Add the consume middleware on every resource you want to apply Rate Usage Limiting. The Consume middleware requires a [Kansas][] instance.

```js
var kansas = require('kansas');
var kansasConsume = require('kansas-express/consume');

// initialize kansas
var api = kansas();

// initialize Consume Middleware
var consume = kansasConsume(api);

// add to any route
app.get('/api/clients', consume.use());
app.get('/api/clients', theAppLogicHandler);
```

The Consume Middleware will check that the API Token is properly set in the request Headers, it exists and it has available units to consume. The remaining usage units will be propagated on the response Headers.

### Configuring the Consume Middleware

Use the method `setup()` to configure the Consume Middleware, it accepts an Object with any of the following properties

* **consumeUnits** `number` *default*: 1 How many units to consume per request.
* **headerToken** `string` *default*: 'X-Api-Token' Header key to expect the API token.
* **headerRemaining** `string` *default*: 'X-RateLimit-Remaining' Header key to populate the response with.
* **handleError** `Function(res, err)` You can overwrite the default Error handler.
* **handleSuccess** `Function(res, next, remaining)` You can overwrite the default Success handler.

```js
var kansasConsume = require('kansas-express/consume');

// create two instances of Consume Middleware
var consume = kansasConsume(api);
var consumeHeavy = kansasConsume(api);

// The heavy API call will consume 5 units
consumeHeavy.setup({
    consumeUnits: 5,
});

// add route for paginated clients
app.get('/api/clients', consume.use());
app.get('/api/clients', theAppLogicHandler);

// add route for all clients
app.get('/api/allclients', consumeHeavy.use());
app.get('/api/allclients', anotherAppLogicHandler);
```

### Consume Error Handling and Types of errors

By default the consume middleware will generate these HTTP Codes on error:

| Error Type | HTTP Code |
|---|---|
| Token Header not set | 401 |
| Token Header set but invalid value | 401 |
| Token does not exist in store| 401 |
| Usage Limit Exceeded | 429 |
| Any other error generated | 401 |

If you define your own Error Handler it will be invoked with two arguments, `res` the response object and `error` the error object. All errors will have a `httpcode` property, a number indicating the suggested HTTP error Code.

### Consume Success Handling

The Consume Middleware will add a response HTTP Header named `X-RateLimit-Remaining` and have as value the remaining usage units. You can change the Header's name using the `setup()` method or you can have your own Success Handler.

The custom Success Handler will be invoked with the following three arguments:

* **res** `Object` The Express response Object.
* **next** `Function` The Express callback to pass controll to the next Express Middleware.
* **remaining** `number` The number or remaining usage units.

## The Manage Middleware

The Manage Middleware will add Token managing routes as a convenience for creating your manage panels and dashboards. By default the following routes will be created when the middleware is initialized:

| Method | Route | Action
|---|---|---|
| POST | /token | Create a new Token |
| GET | /token | Fetch all owner's token items|
| GET | /token/:token | Fetch a single token item |
| DELETE | /token/:token | Delete a token |

```js
var kansas = require('kansas');
var kansasManage = require('kansas-express/manage');

// initialize kansas
var api = kansas();

var manage = store.kansasManage(api);
manage.setup({
  // the provide callback is required
  // it will provide the ownerId and policyName
  // to the middleware
  provide: function(req, res) {
    return {
      ownerId: 'hip',
      policyName: 'free',
    };
  }
});

// pass the express instance to initialize routes
manage.addRoutes(app);
```

### Configuring the Manage Middleware

Use the method `setup()` to configure the Manage Middleware, it accepts an Object with any of the following properties

* **provide** `function` **Required** Will get invoked on each request, needs to provide the `ownerId` and `policyName`.
* **prefix** `string` *default*: "" A prefix to use in the routes.
* **handleError** `Function(res, err)` You can overwrite the default Error handler.
* **handleSuccess** `Function(res, next, remaining)` You can overwrite the default Success handler.

#### About the "provide" Callback

Kansas Express is agnostic to the stack used to track sessions, user objects or authentication. So you need to provide the ownerId and the policy the owner belongs to for each request. This happens with the `provide` callback.

The Provide callback will get invoked with two arguments, the Request and Response Express objects. Thus you have complete control on how the request will turn out, you can perform authentication checks and reject it there and then or provide the required data and pass control to next.

It is expected that the Provide callback will produce an Object with two keys `ownerId` and `policyName` either synchronously or asynchronously. To provide the result asynchronously you need to return a Promise that conforms to the Promises/A+ spec.

```js
manage.setup({
    provide: function(req, res) {
      return new Promise(function(resole, reject) {
        doSomethingAsync(function(udo){
          resolve({
              ownerId: udo.id,
              policyName: udo.policy,
          });
        });
      });
    }
});
```

### Manage Error Handling and Types of errors

By default the Manage middleware will generate these HTTP Codes on error:

| Error Type | HTTP Code |
|---|---|
| Max Tokens per User Limit Exceeded | 403 |
| Any other error generated | 500 |

If you define your own Error Handler it will be invoked with two arguments, `res` the response object and `error` the error object. All errors will have a `httpcode` property, a number indicating the suggested HTTP error Code.

### Manage Success Handling

By default the Manage Middleware will send these HTTP Codes on success:

| Success Type | HTTP Code |
|---|---|
| A request was processed ok | 200 |
| A Delete operation was successful | 204 |

All responses will be JSON encoded and the `Content-Type` Header will have a forced value of `application/json`. You can change all that by using your own Success Handler.

The custom Success Handler will be invoked with the following three arguments:

* **res** `Object` The Express response Object.
* **result** `Object` The result of the operation.
* **action** `Manage.Action` An enum of strings with the following possible values:
  * create
  * readOne
  * readAll
  * delete

## Release History

- **v0.0.2**, *08 Mar 2014*
    - Fix not passing req/res to provide method
    - Update Kansas to latest.
- **v0.0.1**, *03 Mar 2014*
    - Big Bang

## License
Copyright (c) 2014 Thanasis Polychronakis. Licensed under the MIT license.

[express]: expressjs.com
[kansas]: https://github.com/thanpolas/kansas

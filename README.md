# WebDrink Touch

New CSH WebDrink interface for the Drink machine touchscreens. A spin-off of [WebDrink-2.0][webdrink].

Made with [AngularJS][angular], [Twitter Bootstrap][bootstrap], and the [WebDrink API][webdrink-api].

## Usage

### Drink Machine Selection

To select which Drink machine's stock to load, add the `machine_id` query parameter to the URL. 

Example: `https://webdrink.csh.rit.edu/touchscreen/?machine_id=1`

machine_id | Machine Name
--- | ---
1 | Little Drink
2 | Big Drink
3 | Snack

A missing or invalid `machine_id` parameter will result in an initialization error. 

### User Authentication

Unlike the original WebDrink, WebDrink Touch doesn't rely on Webauth to authenticate users. Instead, it must be passed a user's iButton through the `app.loadiButton()` method: 

```javascript
var app = angular.module("touchscreen", []);

app.loadiButton = function(ibutton) {
  $(document).trigger("webdrink.ibutton.receive", { ibutton: ibutton });
};

```

When called with an iButton value, an event is triggered to (re)initialize the Angular app state, authenticate the user, etc.

### config.js

Important settings and development values have been factored out of the main application code.

Create the file `js/config.js` with the following content:

```javascript
// Global configuration object
var CONFIG = (function() {
  var that = {};
  var ibutton = "Your iButton Value";
  // Are we in development mode? (for testing)
  that.devMode = false;
  // Set a test iButton value (if in dev mode)
  if (that.devMode) that.deviButton = ibutton;
  // API config settings
  that.api = {
    // API base URL
    baseUrl: "https://webdrink.csh.rit.edu/api/"
  };
  // App config settings
  that.app = {
    // How long should the app wait for a drop to be started before logging out?
    sessionTimeout: 30000,
    // How long should the app wait to log out after a drink is dropped?
    dropTimeout: 3000,
    // How long should the app wait in between polling the drink server status?
    statusTimeout: 60000
  };
  // Return config object
  return that;
}());
```

#### CONFIG.devMode

Setting `CONFIG.devMode` to `true` will enable developer mode, which:
* Exposes `CONFIG.deviButton` to the application, so you don't need to copy/paste one in.
* Displays a button on landing page to authenticate with `CONFIG.deviButton`, so you don't need to call `app.loadiButton()` from the console.

[angular]: https://angularjs.org/
[bootstrap]: http://getbootstrap.com/
[webdrink]: https://github.com/bencentra/WebDrink-2.0
[webdrink-api]: https://github.com/bencentra/WebDrink-2.0/blob/master/docs/API.md
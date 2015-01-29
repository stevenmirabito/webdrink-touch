# WebDrink Touch

New CSH WebDrink interface for the Drink machine touchscreens. A spin-off of [WebDrink-2.0][webdrink].

Made with [AngularJS][angular], [Twitter Bootstrap][bootstrap], and the [WebDrink API][webdrink-api].

### config.js

To factor out some application settings, create the file `js/config.js` with the following content:

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
    dropTimeout: 3000
  };
  // Return config object
  return that;
}());
```

[angular]: https://angularjs.org/
[bootstrap]: http://getbootstrap.com/
[webdrink]: https://github.com/bencentra/WebDrink-2.0
[webdrink-api]: https://github.com/bencentra/WebDrink-2.0/blob/master/docs/API.md
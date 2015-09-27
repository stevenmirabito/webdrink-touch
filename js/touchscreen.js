/*
*   App
*/

// Angular app
var app = angular.module("touchscreen", []);

// app.loadiButton() - Method to be called by Spynner magic that will authenticate the user by ibutton
app.loadiButton = function(ibutton) {
  $(document).trigger("webdrink.ibutton.receive", { ibutton: ibutton });
};

app.debug = function(msg) {
  if (CONFIG.devMode) {
    console.log(Date.now() + " | " + msg)
  }
};

/*
*   Directives
*/

// "Drink" directive - represents a drink item
app.directive('drink', function() {
  return {
    restrict: "E",
    transclude: true,
    scope: {
      drink: "=data",       // Drink item (object)
      drop: "=drop"        // Drop drink (function)
    },
    templateUrl: "directives/drink.html"
  };
});

/*
*   Services
*/

// "TouchscreenService" - make WebDrink API calls
app.factory("TouchscreenService", ["$http", function($http) {

  // API base URL
  var apiUrl = CONFIG.api.baseUrl;

  // ajaxSuccess() - fires appropriate AJAX callback based on response status
  var ajaxSuccess = function(cbPass, cbFail) {
    return function(resp) {
      if (resp.status === true) {
        cbPass(resp.data);
      } else {
        if (typeof cbFail === "function") {
          cbFail(resp.message);
        } else {
          console.error(resp.message);
        }
      }
    };
  };

  // ajaxError() - handle AJAX errors
  var ajaxError = function(e) {
    console.error(e);
  };

  // Service object
  return {
    // getUser() - Get user info (username, credits, etc)
    getUser: function(ibutton, pass, fail) {
      $http.get(apiUrl+"?request=users/info&ibutton="+ibutton).success(ajaxSuccess(pass, fail)).error(ajaxError);
    },
    // getStock() - Get the stock of a drink machine
    getStock: function(machine, pass, fail) {
      $http.get(apiUrl+"?request=machines/stock&machine_id="+machine).success(ajaxSuccess(pass, fail)).error(ajaxError);
    },
    // getStatus() - Test the connection to the drink server
    getStatus: function(ibutton, pass, fail) {
      var url = apiUrl+"?request=drops/status";
      if (ibutton !== false) {
        url += "&ibutton="+ibutton;
      }
      $http.get(url).success(ajaxSuccess(pass, fail)).error(ajaxError);
    },
    // dropDrink() - Drop a drink
    dropDrink: function(ibutton, machine, slot, pass, fail) {
      var data = {
        ibutton: ibutton,
        machine_id: machine,
        slot_num: slot
      };
      $http({
        method: "POST",
        url: apiUrl+"?request=drops/drop",
        data: jQuery.param(data),
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
      }).success(ajaxSuccess(pass, fail)).error(ajaxError);
    }
  };

}]);

/*
*   Controllers
*/

// "TouchscreenController" - Main app controller
app.controller("TouchscreenController", ["$scope", "$timeout", "$interval", "TouchscreenService", function($scope, $timeout, $interval, TouchscreenService) {

  $scope.devMode = CONFIG.devMode; // Are we in development mode?

  var resetTimeout; // For session timeouts when logged it
  var statusInterval; // For status check when logged out
  var machineId; // ID of the current drink machine

  // getMachineId() - Get the ID of the current Drink machine from the URL query string
  var getMachineId = function() {
    var search = window.location.search;
    if (search === "" || search.indexOf("machine_id=") === -1) { 
      $scope.message = "Initialization Error";
      $scope.detail = "Missing `machine_id` URL query parameter";
      return;
    }
    search = parseInt(search.split("machine_id=")[1].substr(0, 1));
    if (search < 1 || search > 3) {
      $scope.message = "Initialization Error";
      $scope.detail = "Invalid `machine_id`; must be 1, 2, or 3";
      return;
    }
    machineId = search;
  };

  // reset() - Reset the state of the controller
  var reset = function() {
    app.debug("reset()");
    $scope.ibutton = false;
    getServerStatus();
    $scope.stock = [];
    $scope.user = {};
    $scope.message = "Touch iButton or Tap RFID";
    $scope.detail = false;
    $timeout.cancel(resetTimeout);
    statusInterval = $interval(getServerStatus, CONFIG.app.statusTimeout);
  };
  // Add reset to the $scope
  $scope.logout = reset;

  // authenticate() - Authenticate the user by ibutton value and initialize the drop selection
  var authenticate = function(ibutton) {
    app.debug("authenticate()");
    ibutton = ibutton || (CONFIG.devMode ? CONFIG.deviButton : false);
    getUserInfo(ibutton);
  };
  // Add authenticate to the $scope if in devMode
  if ($scope.devMode) {
    $scope.login = authenticate;
  }
  // Listen for authenticaiton event
  $(document).on("webdrink.ibutton.receive", function(e, data) {
    authenticate(data.ibutton);
  });

  // getServerStatus() - Check the status of the drink server
  var getServerStatus = function() {
    app.debug("getServerStatus()");
    TouchscreenService.getStatus(
      $scope.ibutton, 
      function(data) {
        $scope.connected = data;
      },
      function(msg) {
        console.error(msg);
        $scope.connected = false;
      }
    );
  };

  // getUserInfo() - Get the user's full info (username, credits, etc)
  var getUserInfo = function(ibutton) {
    app.debug("getUserInfo()");
    if (ibutton === false) return false;
    TouchscreenService.getUser(
      ibutton, 
      function(data) {
        $scope.ibutton = ibutton;
        $scope.user = data;
        $interval.cancel(statusInterval);
        getServerStatus();
        getMachineStock();
        resetTimeout = $timeout(reset, CONFIG.app.sessionTimeout);
      },
      function(msg) {
        $("#ibutton").removeClass("hide");
        $timeout(function() {
          $("#ibutton").addClass("hide");
        }, CONFIG.app.dropTimeout);
      }
    );
  };

  // getMachineStock() - Get the stock of the current drink machine
  var getMachineStock = function() {
    app.debug("getMachineStock()");
    if (machineId === false) return false;
    TouchscreenService.getStock(machineId, function(data) {
      $scope.stock = data[machineId];
      for (var i = 0; i < $scope.stock.length; i++) {
        $scope.stock[i].disabled = isDrinkDisabled($scope.stock[i]);
      }
    });
  };

  // closeModal() - Close the drop modal
  var closeModal = function() {
    app.debug("closeModal()");
    $timeout(function() {
      $("#drop").modal("hide");
      reset();
    }, CONFIG.app.dropTimeout);
  };

  // dropDrink() - Drop the selected drink
  var dropDrink = function(drink) {
    app.debug("dropDrink()");
    if (isDrinkDisabled(drink)) return false;
    if ($scope.connected === false) return false;
    // Don't end the session
    $timeout.cancel(resetTimeout);
    // Drop the drink
    $scope.drop_message = "Dropping " + drink.item_name + "...";
    $("#drop").modal("show");
    TouchscreenService.dropDrink(
      $scope.ibutton, 
      drink.machine_id, 
      drink.slot_num, 
      // Success!
      function(data) {
        $scope.drop_message = "Drink Dropped!";
        closeModal();
      },
      // Failure!
      function(msg) {
        $scope.drop_message = msg;
        closeModal();
      }
    );
  };
  // Add dropDrink to the $scope
  $scope.drop = dropDrink;

  // isDrinkDisabled() - Determine if the selected drink is enabled/available/affordable
  var isDrinkDisabled = function(drink) {
    app.debug("isDrinkDisabled()");
    if (drink.status !== 'enabled' ||
        parseInt(drink.available) === 0 ||
        parseInt(drink.item_price) > parseInt($scope.user.credits) ||
        $scope.connected === false) {
      return true;
    }
    return false;
  };

  // Initialize the page
  reset();
  getMachineId();

}]);
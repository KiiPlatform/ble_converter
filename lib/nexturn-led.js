var async = require('async');
var events = require('events');
var util = require('util');

var NEXTURN_RGBW_CHAR = 'ffe5';
var NEXTURN_COLOR_SERVICE = 'ffe0';

var NexturnLED = function(peripheral) {

  this._peripheral = peripheral;
  this.vendorThingID = "nexturn-" + peripheral.id;

  this._services = {};
  this._characteristics = {};

  this._peripheral.on('disconnect', this.onDisconnect.bind(this));

};

// TODO: use it to check peripheral type
NexturnLED.is = function(peripheral) {
  return (peripheral.advertisement.localName === 'Nexturn');
};


util.inherits(NexturnLED,  events.EventEmitter);

NexturnLED.prototype.onDisconnect = function() {
  this.connectedAndSetUp = false;
  this.emit('disconnect');
};

NexturnLED.prototype.connectAndSetUp = function(callback){
  this._peripheral.connect(function(err){
    if (err){
      return callback(err);
    }
    this.discoverServicesAndCharacteristics(function() {
      this.connectedAndSetUp = true;
      callback(null);
    }.bind(this));
  }.bind(this));
}

NexturnLED.prototype.discoverServicesAndCharacteristics = function(callback) {
  this._peripheral.discoverAllServicesAndCharacteristics(function(error, services/*, characteristics*/) {
    if (error) {
      return callback(error);
    }

    for (var i in services) {
      var service = services[i];
      var characteristics = service.characteristics;

      var serviceUuid = service.uuid;

      this._services[serviceUuid] = service;
      this._characteristics[serviceUuid] = {};

      for (var j in characteristics) {
        var characteristic = characteristics[j];

        this._characteristics[serviceUuid][characteristic.uuid] = characteristic;
      }
    }

    callback(null);
  }.bind(this));
};

NexturnLED.prototype.readDataCharacteristic = function(serviceUuid, characteristicUuid, callback) {
  if (!this._characteristics[serviceUuid]) {
    return callback(new Error('service uuid ' + serviceUuid + ' not found!'));
  } else if (!this._characteristics[serviceUuid][characteristicUuid]) {
    return callback(new Error('characteristic uuid ' + characteristicUuid + ' not found in service uuid ' + serviceUuid + '!'));
  }

  this._characteristics[serviceUuid][characteristicUuid].read(callback);
};

NexturnLED.prototype.writeDataCharacteristic = function(serviceUuid, characteristicUuid, data, callback) {
  if (!this._characteristics[serviceUuid]) {
    return callback(new Error('service uuid ' + serviceUuid + ' not found!'));
  } else if (!this._characteristics[serviceUuid][characteristicUuid]) {
    return callback(new Error('characteristic uuid ' + characteristicUuid + ' not found in service uuid ' + serviceUuid + '!'));
  }

  var characteristic = this._characteristics[serviceUuid][characteristicUuid];

  var withoutResponse = (characteristic.properties.indexOf('writeWithoutResponse') !== -1) &&
                          (characteristic.properties.indexOf('write') === -1);

  characteristic.write(data, withoutResponse, function(error) {
    if (typeof callback === 'function') {
      callback(error);
    }
  });
};

NexturnLED.prototype.readRGBWColor = function(callback){
  this.readDataCharacteristic(NEXTURN_COLOR_SERVICE, NEXTURN_RGBW_CHAR, function(err, data){
    if(err !== null && err !== undefined) {
      callback(err);
      return;
    }
    callback(null, data[0], data[1], data[2], data[3]);
  });
};

NexturnLED.prototype.writeRGBWColor = function(red, green, blue, white, callback){
  this.writeDataCharacteristic(NEXTURN_COLOR_SERVICE, NEXTURN_RGBW_CHAR, new Buffer([red, green, blue, white]), function(err){
    callback(err);
  });
};

NexturnLED.prototype._handleChangeColor = function(actionItems, gCallback) {
  var red = actionItems["Red"];
  var green = actionItems["Green"];
  var blue = actionItems["Blue"];
  var white = actionItems["White"];
  if (red !== null && red !== undefined &&
    green !== null && green !== undefined &&
    blue !== null && blue !== undefined &&
    white !== null && white !== undefined){

    peripheral = this;
    async.series([
      function(callback){
        peripheral.writeRGBWColor(red, green, blue, white, function(err){
          if (err === null || err === undefined ){
            console.log("change color succeeded");
            callback();
          }else{
            console.log("change color failed:"+err);
            callback(err);
          }
        });
      },
      // check action executed result
      function(callback){
        peripheral.readRGBWColor(function(err, redRead, greenRead, blueRead, whiteRead){
          var succeeded = false;
          var errMessage = "";
          var data = {};
          if (err === null || err === undefined) {
            succeeded = redRead === red &&
              greenRead === green &&
              blueRead === blue &&
              whiteRead === white;
            data = {Red:redRead, Green:greenRead, Blue:blueRead, White:whiteRead};
          }else{
            errMessage = err
          }
          gCallback({
            succeeded: succeeded,
            errorMessage: errMessage,
            data: data
          });
          callback();
        });
      }
    ]);
  }
}

NexturnLED.prototype.handleCommands = function(commands, gCallback) {
  console.log("handling commands");
  var actions = commands["actions"];
  if (actions !== null && actions !== undefined) {
    var actionIndex = 0;
    var actionResults = [];
    if (actions.length === 0) {
      gCallback(new Error("No action to execute"), null);
    }
    peripheral = this;
    async.whilst(
      function(){
        return actionIndex < actions.length;
      },
      function(callback){
        action = actions[actionIndex];
        for (var key in action) {
          if (key === "changeColor"){
            peripheral._handleChangeColor(action["changeColor"],
              function(actionResult){
                var changeClorResult = {};
                changeClorResult[key]= actionResult;
                actionResults.push(changeClorResult);
                actionIndex++;
                callback();
              });
          }else{
            var actionResult = {};
            actionResult[key]= {succeeded:false, errorMessage: "No handler for this action", data: {}};
            actionResults.push(actionResult);
            actionIndex++;
            callback();
          }
        }
      },
      function(err){
        var commandResultsObject = {
          commandID: commands["commandID"],
          actionResults: actionResults
        };
        gCallback(null, commandResultsObject);
      }
    );
  }else{
    gCallback(new Error("Invalid commands"), null);
  }
}

NexturnLED.prototype.getStates = function(callback){
  this.readRGBWColor(function(err, red, green, blue, white){
    if(err !== null && err !== undefined) {
      callback(err, null);
    }else{
      callback(err, {Red:red, Green: green, Blue:blue, White:white});
    }
  });
}
// export your device
module.exports = NexturnLED;

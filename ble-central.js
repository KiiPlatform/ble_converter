var NexturnLED = require('./lib/nexturn-led.js');
var BlecastBL = require('./lib/blecast-bl.js');
var noble = require('noble');
var EventEmitter = require('events');
var util = require('util');

// level is error by default
var winston = require('winston');
winston.level = 'error';

var peripheralMap = {};
var bleBlLastUpdates = {};

function indexOf(peripheral) {
  var key = Object.keys(peripheralMap).filter(function(peripheral) {return peripheralMap[key] === peripheral})[0];
  return key;
}

function BLECentral(){
  EventEmitter.call(this);
}

util.inherits(BLECentral, EventEmitter);

BLECentral.prototype.start = function(){
  var that = this;

  noble.on('stateChange', function(state){
    if (state === 'poweredOn') {
      noble.startScanning([], true);
    }
  });

  var onDiscover = function(peripheral) {
    var localName = peripheral.advertisement.localName;
    var deviceId = peripheral.id;
    var endnode;
    if (localName === 'BLECAST_BL' || localName === 'BLECAST_BL\u0000') {
      temp = new BlecastBL(peripheral);
      peripheralMap[deviceId] = temp;
      if (bleBlLastUpdates[deviceId] === null || bleBlLastUpdates[deviceId] === undefined) {
        that.emit("endnodeConnect", deviceId);
      }
      bleBlLastUpdates[deviceId] = Date.now();
      winston.debug("Found BLECAST_BL, vendorThingID:"+temp.vendorThingID+", states:"+JSON.stringify(temp.states));
      that.emit("endnodeUpdateStates", deviceId, temp.states);

    }else if(localName === 'Nexturn') {
      var nexturnLed = new NexturnLED(peripheral);
      if (peripheralMap[deviceId] !== undefined && peripheralMap[deviceId] !== null){
        return;
      }
      peripheralMap[deviceId] = nexturnLed;

      nexturnLed.connectAndSetUp(function(err) {
        if(err !== null && err !== undefined) {
          winston.error("connect to led faild: "+ err);
          return;
        }
        that.emit("endnodeConnect", deviceId);
        nexturnLed.on('disconnect', function() {
          winston.debug("lost connection with "+nexturnLed.uuid);
          if (nexturnLed.vendorThingID !== "" && nexturnLed.vendorThingID !== undefined){
            // delete it from peripheralMap
            winston.debug('delete the disconnected peripheral from peripheralMap');
            delete peripheralMap[nexturnLed.vendorThingID];
            that.emit("endnodeDisconnect", deviceId);
          }
        });
        nexturnLed.getStates(function(err, state){
          if (err === null || err === undefined) {
            winston.debug( "state of endnode:"+JSON.stringify(state));
            that.emit("endnodeUpdateStates", deviceId, state);
          }else {
            winston.error( "get state of endnode failed:"+err);
          }
        });

      });
    }else{
      return
    }
  };

  // Put your endnode devices here
  noble.on('discover', onDiscover);
  // check updates of blecast_bl
  var onTimeUp = function(){
    for (var key in bleBlLastUpdates) {
      var updated = bleBlLastUpdates[key];
      var now = Date.now();
      var diff = (now - updated)/1000;
      // if last update of blecast_bl longer than 10 seconds, then report disconnection
      if (diff > 10) {
        delete peripheralMap[key];
        delete bleBlLastUpdates[key];
        that.emit("endnodeDisconnect", key);
      }
    }
  };
  setInterval(onTimeUp, 10000);
}

BLECentral.prototype.stop = function(){

}

BLECentral.prototype.getStates = function(id, callback){
  var peripheral = peripheralMap[id];
  if (peripheral === null || peripheral === undefined) {
    callback(new Error("connection not existed"), null);
    return;
  }
  if (typeof peripheral.getStates == 'function') {
    peripheral.getStates(function(err, states){
      callback(err, states);
    });
  }else{
    callback(null, peripheral.states);
  }
}

BLECentral.prototype.handleCommands = function(id, commands, callback) {
  var peripheral = peripheralMap[id];
  if (peripheral === null || peripheral === undefined) {
    callback(new Error("connection not existed"), null);
    return;
  }
  if (typeof peripheral.handleCommands == 'function') {
    peripheral.handleCommands(commands, function(err, commandResults){
      callback(err, commandResults);
    });
  }else{
    callback(new Error("This peripheral doesn't implement handleCommands method!"), null);
  }
}

BLECentral.prototype.setWinston = function(logger) {
  winston = logger;
}

module.exports = BLECentral;

var events = require('events');
var util = require('util');

// get alias from config.json
var nconf = require('nconf');
nconf.file({ file: 'config.json' });
var alias = nconf.get('alias:blecast-bl');

// since this kind of device put sensed data in broadcasting package, the data can get
// when constructing
var BlecastBL = function (peripheral) {
  if (peripheral !== null && peripheral !== undefined){
    this._peripheral = peripheral;

    // construct vendor thing id from id of peripheral
    this.vendorThingID = "blecast_bl-" + peripheral.id+"-1";

    // parse raw data to kii thing state
    var rawState = {
      illuminance: this._parseLightness(peripheral.advertisement.manufacturerData)
    }

    // states is exposed with attribute
    if (alias != null) {
      this.states = {}
      this.states[alias] = rawState
    }else{
      this.states = rawState
    }
  }
}

util.inherits(BlecastBL, events.EventEmitter);

// TODO: use it to check peripheral type
BlecastBL.prototype.is = function(peripheral) {
  var localName = peripheral.advertisement.localName;
  return (localName === 'BLECAST_BL\u0000' || localName === 'BLECAST_BL');
};

BlecastBL.prototype._parseLightness = function(manufacturerData) {
  var bl = manufacturerData.readUInt8(4) + manufacturerData.readUInt8(5) * 256;
  return bl;
}

module.exports = BlecastBL;

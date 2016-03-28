var events = require('events');
var util = require('util');

var BlecastBL = function (peripheral) {
  if (peripheral !== null && peripheral !== undefined){
    this._peripheral = peripheral;
    this.vendorThingID = peripheral.id;
    this.states = {
      Lightness: this._parseLightness(peripheral.advertisement.manufacturerData),
      Unit: 'lx'
    };
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

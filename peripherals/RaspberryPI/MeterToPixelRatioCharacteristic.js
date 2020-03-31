var util = require('util');
var bleno = require('bleno');

var BeaconData = require('./BeaconData.js');

var BlenoCharacteristic = bleno.Characteristic;

const CHARATERISTIC_UUID = 'fffffffffffffffffffffffffffffff4';

function MeterToPixelCharacteristic() {
    MeterToPixelCharacteristic.super_.call(this, {
        uuid: CHARATERISTIC_UUID,
        properties: ['read']
    });
}

util.inherits(MeterToPixelCharacteristic, BlenoCharacteristic);

MeterToPixelCharacteristic.prototype.onReadRequest = function(offset, callback) {
    var result = this.RESULT_SUCCESS;
    //Creates the Buffer with a size 4 bytes because a float is 4 bytes
    var data = new Buffer(4);

    //Write the meter to pixel ratio float value to the buffer
    data.writeFloatLE(BeaconData.meterToPixelRatio);

    if(offset > data.length)
    {
        result = this.RESULT_INVALID_OFFSET;
        data = null;
    }
    else
    {
        data = data.slice(offset);
    }

    //Sends the data back to the central device
    callback(result, data);
};

module.exports = MeterToPixelCharacteristic;

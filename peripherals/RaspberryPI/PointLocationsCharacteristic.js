var util = require('util');
var bleno = require('bleno');

var BeaconData = require('./BeaconData.js');

var BlenoCharacteristic = bleno.Characteristic;

const CHARATERISTIC_UUID = 'fffffffffffffffffffffffffffffff1';

//Sets up the point locations characteristic as a read characteristic
function PointLocationsCharacteristic() {
    PointLocationsCharacteristic.super_.call(this, {
        uuid: CHARATERISTIC_UUID,
        properties: ['read']
    });
}

util.inherits(PointLocationsCharacteristic, BlenoCharacteristic);

PointLocationsCharacteristic.prototype.onReadRequest = function(offset, callback) {
    var result = this.RESULT_SUCCESS;
    //Creates the Buffer with a size of locationData * 4 because each integer is 4 bytes
    var data = new Buffer(BeaconData.locationData.length * 4);

    //Write each integer from the locationData into the buffer
    for(var i = 0; i < BeaconData.locationData.length; i++)
    {
        data.writeUInt32LE(BeaconData.locationData[i], i*4);
    }

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

module.exports = PointLocationsCharacteristic;
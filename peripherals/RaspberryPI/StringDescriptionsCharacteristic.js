var util = require('util');
var bleno = require('bleno');

var BeaconData = require('./BeaconData.js');

var BlenoCharacteristic = bleno.Characteristic;

const CHARATERISTIC_UUID = 'fffffffffffffffffffffffffffffff2';

function StringDescriptionsCharacteristic()
{
    StringDescriptionsCharacteristic.super_.call(this, {
        uuid: CHARATERISTIC_UUID,
        properties: ['read']
    });
}

util.inherits(StringDescriptionsCharacteristic, BlenoCharacteristic);

StringDescriptionsCharacteristic.prototype.onReadRequest = function(offset, callback) {
    var result = this.RESULT_SUCCESS;

    //keeps track of the amount of bytes required to send the array of strings
    let dataSize = 0;
    //loops through all the strings in the array and reserves space for 1 bytes plus the length of the string for each string in the array
    for(let i = 0; i < BeaconData.descriptionData.length; i++)
    {
        dataSize += 1 + BeaconData.descriptionData[i].length;
    }

    //Creates a buffer with the data to send with a size of the dataSize found above
    var data = new Buffer(dataSize);

    //Keeps track of the next location in the byte buffer to write data to
    let dataOffset = 0;
    //loops through all the strings and writes their data to the buffer
    for(let i = 0; i < BeaconData.descriptionData.length; i++)
    {
        //write the strings 1 byte length to the buffer
        data.writeInt8(BeaconData.descriptionData[i].length, dataOffset);
        //write the strings character data to the buffer
        data.write(BeaconData.descriptionData[i], dataOffset + 1);
        //increment the data offset by 1 byte for the length and the length of the string written
        dataOffset += 1 + BeaconData.descriptionData[i].length;
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

    //Sends the data to the central device
    callback(result, data);
}

module.exports = StringDescriptionsCharacteristic;
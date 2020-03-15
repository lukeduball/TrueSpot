var util = require('util');
var bleno = require('bleno');

var BlenoCharacteristic = bleno.Characteristic;

var BeaconData = require('./BeaconData.js');

const CHARACTERISTIC_UUID = 'fffffffffffffffffffffffffffffff3';

//Sets up the Map Image Characteristic as a notify characteristic at the specifed UUID
function MapImageNotifyCharacteristic() {
    MapImageNotifyCharacteristic.super_.call(this, {
        uuid: CHARACTERISTIC_UUID,
        properties: ['notify']
    });
};

util.inherits(MapImageNotifyCharacteristic, BlenoCharacteristic);

//Called when a central device subscribes to the characterstic
MapImageNotifyCharacteristic.prototype.onSubscribe = function(maxValueSize, updateValueCallback) {
    console.log('Subscribe for MapImage');

    //Creates a Buffer from the image data loaded from the disk
    let imageDataBuffer = Buffer.from(BeaconData.imageData);
    //Keeps track of the start of the next bytes to write from the imageDataBuffer
    let dataOffset = 0;

    //Need to set this interval otherwise large data sets will overflow the buffer and cause packet queueing loss and errors on the central device
    //Sends 100 packets every second
    var dataInterval = setInterval(function()
    {
        //Counter to queue 100 packets to send
        for(let i = 0; i < 100; i++)
        {
            //Check if the start of the next data to send if less than the image buffer length
            if(dataOffset < imageDataBuffer.length)
            {
                //The maximum bytes that can be sent per packet is MTU - 3, because 3 bytes are reserved for the header of the packet 
                let dataSize = BeaconData.currentMTU - 3;
                //sends the data packet to the central device
                updateValueCallback(imageDataBuffer.slice(dataOffset, dataOffset + dataSize));
                //increases the data offset by the data size to be at the next position in the buffer
                dataOffset += dataSize;
            }
            else
            {
                //There is no more data to send, so stop calling the interval function
                clearInterval(dataInterval);

                //writes 1 byte with a value -127 to indicate the end of the data to the central
                let finalBufferIndicator = new Buffer(1);
                finalBufferIndicator.writeInt8(-127);
                updateValueCallback(finalBufferIndicator);

                console.log('Finished Sending Data');
                return;
            }
        }
    }, 1000);
};

MapImageNotifyCharacteristic.prototype.onUnsubscribe = function() {
    console.log('Map image unsubscribe');
};

MapImageNotifyCharacteristic.prototype.onNotify = function() {

};

module.exports = MapImageNotifyCharacteristic;
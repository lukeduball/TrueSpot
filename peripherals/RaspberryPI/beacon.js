var util = require('util');
var bleno = require('bleno');
var fs = require('fs');

var imageData = fs.readFileSync('./floorplan.jpg', 'base64');
console.log('Successfully loaded image!');

var locationData = Array(630, 420,
                    1000, 800);
var descriptionData = Array("Bedroom Door", "Living Room Center");

var NAME = "Raspberry PI Beacon";

var currentMTU = 23;

var BlenoPrimaryService = bleno.PrimaryService;
var BlenoCharacteristic = bleno.Characteristic;
var BlenoDescriptor = bleno.Descriptor;

console.log('Starting Bleno...');

var StringDescriptionsCharacteristic = function()
{
    StringDescriptionsCharacteristic.super_.call(this, {
        uuid: 'fffffffffffffffffffffffffffffff2',
        properties: ['read']
    });
}

util.inherits(StringDescriptionsCharacteristic, BlenoCharacteristic);

StringDescriptionsCharacteristic.prototype.onReadRequest = function(offset, callback) {
    var result = this.RESULT_SUCCESS;

    let dataSize = 0;
    for(let i = 0; i < descriptionData.length; i++)
    {
        dataSize += 1 + descriptionData[i].length;
    }

    var data = new Buffer(dataSize);

    let dataOffset = 0;
    for(let i = 0; i < descriptionData.length; i++)
    {
        data.writeUInt16LE(descriptionData[i].length, dataOffset);
        data.write(descriptionData[i], dataOffset + 1);
        dataOffset += 1 + descriptionData[i].length;
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

    callback(result, data);
}

var PointLocationsCharacteristic = function() {
    PointLocationsCharacteristic.super_.call(this, {
        uuid: 'fffffffffffffffffffffffffffffff1',
        properties: ['read']
    });
}

util.inherits(PointLocationsCharacteristic, BlenoCharacteristic);

PointLocationsCharacteristic.prototype.onReadRequest = function(offset, callback) {
    var result = this.RESULT_SUCCESS;
    var data = new Buffer(locationData.length * 4);

    for(var i = 0; i < locationData.length; i++)
    {
        data.writeUInt32LE(locationData[i], i*4);
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

    callback(result, data);
};

var MapImageNotifyCharacteristic = function() {
    MapImageNotifyCharacteristic.super_.call(this, {
        uuid: 'fffffffffffffffffffffffffffffff3',
        properties: ['notify']
    });
};

util.inherits(MapImageNotifyCharacteristic, BlenoCharacteristic);

MapImageNotifyCharacteristic.prototype.onSubscribe = function(maxValueSize, updateValueCallback) {
    console.log('Subscribe for MapImage');

    let imageDataBuffer = Buffer.from(imageData);
    let dataOffset = 0;
    while(dataOffset < imageDataBuffer.length)
    {
        let dataSize = currentMTU - 3;
        updateValueCallback(imageDataBuffer.slice(dataOffset, dataOffset + dataSize));
        dataOffset += dataSize;
    }
    let finalBufferIndicator = new Buffer(1);
    finalBufferIndicator.writeInt8(-127);
    updateValueCallback(finalBufferIndicator);
    console.log('Finished Sending Data');
};

MapImageNotifyCharacteristic.prototype.onUnsubscribe = function() {
    console.log('Map image unsubscribe');
};

MapImageNotifyCharacteristic.prototype.onNotify = function() {

};


function SampleService() {
    SampleService.super_.call(this, {
        uuid: 'fffffffffffffffffffffffffffffff0',
        characteristics: [
            new PointLocationsCharacteristic(),
            new StringDescriptionsCharacteristic(),
            new MapImageNotifyCharacteristic()
        ]
    });
}

util.inherits(SampleService, BlenoPrimaryService);

bleno.on('stateChange', function(state) 
{
    console.log('on -> stateChange: ' + state + ', address = ' + bleno.address);

    if(state == 'poweredOn')
    {
        bleno.startAdvertising(NAME, ['fffffffffffffffffffffffffffffff0']);
    }
    else
    {
        bleno.stopAdvertising();
    }
});

bleno.on('advertisingStart', function(error) {
    console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));

    if(!error)
    {
        bleno.setServices([
            new SampleService()
        ]);
    }
});

bleno.on('mtuChange', function(mtu){
    console.log('on -> mtuChange: New MTU value: '+mtu);
    currentMTU = mtu;
});
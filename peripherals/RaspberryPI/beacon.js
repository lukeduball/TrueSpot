var util = require('util');
var bleno = require('bleno');
var fs = require('fs');

var imageData;
fs.readFile('./floorplan.jpg', 'base64', function(error, data) {
    if(error)
    {
        console.log(error);
        return;
    }
    imageData = data;
    console.log('Successfully load image!');
});

var locationData = Array(630, 420,
                    1000, 800);
var descriptionData = Array("Bedroom Door", "Living Room Center");

var NAME = "Raspberry PI Beacon"

var BlenoPrimaryService = bleno.PrimaryService;
var BlenoCharacteristic = bleno.Characteristic;
var BlenoDescriptor = bleno.Descriptor;

console.log('Starting Bleno...');

var DynamicReadOnlyCharacteristic = function() {
    DynamicReadOnlyCharacteristic.super_.call(this, {
        uuid: 'fffffffffffffffffffffffffffffff2',
        properties: ['read']
    });
};
util.inherits(DynamicReadOnlyCharacteristic, BlenoCharacteristic);

DynamicReadOnlyCharacteristic.prototype.onReadRequest = function(offset, callback) {
    var result = this.RESULT_SUCCESS;
    var data = new Buffer('dynamic value');

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

var StringDescriptionsCharacteristic = function()
{
    StringDescriptionsCharacteristic.super_.call(this, {
        uuid: 'fffffffffffffffffffffffffffffff4',
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

var LongDynamicReadOnlyCharacteristic = function() {
    LongDynamicReadOnlyCharacteristic.super_.call(this, {
        uuid: 'fffffffffffffffffffffffffffffff3',
        properties: ['read']
    });
}

util.inherits(LongDynamicReadOnlyCharacteristic, BlenoCharacteristic);

LongDynamicReadOnlyCharacteristic.prototype.onReadRequest = function(offset, callback) {
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

var NotifyOnlyCharacteristic = function() {
    NotifyOnlyCharacteristic.super_.call(this, {
        uuid: 'fffffffffffffffffffffffffffffff5',
        properties: ['notify']
    });
};

util.inherits(NotifyOnlyCharacteristic, BlenoCharacteristic);

NotifyOnlyCharacteristic.prototype.onSubscribe = function(maxValueSize, updateValueCallback) {
    console.log('Notify Subscribe');

    this.counter = 0;
    this.changeInterval = setInterval(function() {
        var data = new Buffer(4);
        data.writeUInt32LE(this.counter, 0);

        console.log('Notify update value: '+ this.counter);
        updateValueCallback(data);
        this.counter++;
    }.bind(this), 5000);
};

NotifyOnlyCharacteristic.prototype.onUnsubscribe = function() {
    console.log('Notify unsubscribe');

    if(this.changeInterval)
    {
        clearInterval(this.changeInterval);
        this.changeInterval = null;
    }
};

NotifyOnlyCharacteristic.prototype.onNotify = function() {
    console.log("Notify on notify call");
};

function SampleService() {
    SampleService.super_.call(this, {
        uuid: 'fffffffffffffffffffffffffffffff0',
        characteristics: [
            new DynamicReadOnlyCharacteristic(),
            new LongDynamicReadOnlyCharacteristic(),
            new StringDescriptionsCharacteristic(),
            new NotifyOnlyCharacteristic()
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
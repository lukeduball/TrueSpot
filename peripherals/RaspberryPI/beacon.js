var bleno = require('bleno');

var NAME = "TS_DataBeacon_Home";
var TX_POWER_LEVEL = -31;

//Default value for the MTU is 23 bytes
var currentMTU = 23;

var BeaconData = require('./BeaconData');
var BeaconService = require('./BeaconService');

bleno.on('stateChange', function(state) 
{
    console.log('on -> stateChange: ' + state + ', address = ' + bleno.address);

    if(state == 'poweredOn')
    {
        startAdvertisingBeaconData(NAME, ['fffffffffffffffffffffffffffffff0'], TX_POWER_LEVEL);
    }
    else
    {
        bleno.stopAdvertising();
    }
});

function startAdvertisingBeaconData(name, serviceUuids, txPower)
{
    var advertisementDataLength = 3;
    var scanDataLength = 0;

    var serviceUuids16bit = [];
    var serviceUuids128bit = [];
    var i = 0;

    if(name && name.length)
    {
        scanDataLength += 2 + name.length;
    }

    if(txPower)
    {
        scanDataLength += 3;
    }

    if(serviceUuids && serviceUuids.length)
    {
        for(i = 0; i < serviceUuids.length; i++)
        {
            var serviceUuid = new ArrayBuffer(serviceUuids[i].match(/.{1,2}/g).reverse().join(''), 'hex');

            if(serviceUuid.length === 2)
            {
                serviceUuids16bit.push(serviceUuid);
            }
            else if(serviceUuid.length === 16)
            {
                serviceUuids128bit.push(serviceUuid);
            }
        }
    }

    if(serviceUuids16bit.length)
    {
        advertisementDataLength += 2 + 2 * serviceUuids16bit.length;
    }

    if(serviceUuids128bit.length)
    {
        advertisementDataLength += 2 + 16 * serviceUuids128bit.length;
    }

    var advertisementData = new Buffer(advertisementDataLength);
    var scanData = new Buffer(scanDataLength);

    //flags
    advertisementData.writeUInt8(2,0);
    advertisementData.writeUInt8(0x01, 1);
    advertisementData.writeUInt8(0x06, 2);

    var advertisementDataOffset = 3;

    if(serviceUuids16bit.length)
    {
        advertisementData.writeUInt8(1 + 2 * serviceUuids16bit.length, advertisementDataOffset);
        advertisementDataOffset++;

        advertisementData.writeUInt8(0x02, advertisementDataOffset);
        advertisementDataOffset++;

        for(i = 0; i < serviceUuids16bit.length; i++)
        {
            serviceUuids16bit[i].copy(advertisementData, advertisementDataOffset);
            advertisementDataOffset += serviceUuids16bit[i].length;
        }
    }

    if(serviceUuids128bit.length)
    {
        advertisementData.writeUInt8(1 + 16 * serviceUuids128bit.length, advertisementDataOffset);
        advertisementDataOffset++;

        advertisementData.writeUInt8(0x06, advertisementDataOffset);
        advertisementDataOffset++;

        for(i = 0; i < serviceUuids128bit.length; i++)
        {
            serviceUuids128bit[i].copy(advertisementData, advertisementDataOffset);
            advertisementDataOffset += serviceUuids128bit[i].length;
        }
    }

    var scanDataOffset = 0;

    //name
    if(name && name.length)
    {
        var nameBuffer = new Buffer(name);

        scanData.writeUInt8(1 + nameBuffer.length, scanDataOffset);
        scanDataOffset++;
        scanData.writeUInt8(0x08, scanDataOffset);
        scanDataOffset++;
        nameBuffer.copy(scanData, scanDataOffset);
        scanDataOffset+=nameBuffer.length;
    }

    //TX_POWER
    if(txPower)
    {
        scanData.writeUInt8(2, scanDataOffset);
        scanDataOffset++;
        scanData.writeUInt8(0x0A, scanDataOffset);
        scanDataOffset++;
        scanData.writeInt8(txPower, scanDataOffset);
    }

    bleno.startAdvertisingWithEIRData(advertisementData, scanData);
}

bleno.on('advertisingStart', function(error) {
    console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));

    if(!error)
    {
        bleno.setServices([
            new BeaconService()
        ]);
    }
});

bleno.on('mtuChange', function(mtu){
    console.log('on -> mtuChange: New MTU value: '+mtu);
    BeaconData.currentMTU = mtu;
});

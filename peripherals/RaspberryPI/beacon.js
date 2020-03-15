var bleno = require('bleno');

var NAME = "Raspberry PI Beacon";

//Default value for the MTU is 23 bytes
var currentMTU = 23;

var BeaconData = require('./BeaconData');
var BeaconService = require('./BeaconService');

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
            new BeaconService()
        ]);
    }
});

bleno.on('mtuChange', function(mtu){
    console.log('on -> mtuChange: New MTU value: '+mtu);
    BeaconData.currentMTU = mtu;
});
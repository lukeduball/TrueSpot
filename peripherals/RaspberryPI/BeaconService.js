var util = require('util');
var bleno = require('bleno');

var BlenoPrimaryService = bleno.PrimaryService;
const SERVICE_UUID = 'fffffffffffffffffffffffffffffff0';

var PointLocationsCharacteristic = require('./PointLocationsCharacteristic.js');
var StringDescriptionsCharacteristic = require('./StringDescriptionsCharacteristic.js');
var MapImageNotifyCharacteristic = require('./MapImageNotifyCharacteristic.js');

//Setup the Beacon Service with the following characteristics
function BeaconService() {
    BeaconService.super_.call(this, {
        uuid: SERVICE_UUID,
        characteristics: [
            new PointLocationsCharacteristic(),
            new StringDescriptionsCharacteristic(),
            new MapImageNotifyCharacteristic(),
        ]
    });
}

util.inherits(BeaconService, BlenoPrimaryService);

module.exports = BeaconService;
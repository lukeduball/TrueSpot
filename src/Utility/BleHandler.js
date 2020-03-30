import { BleManager } from 'react-native-ble-plx'
import { Point } from './Point.js'
import { Buffer } from 'buffer'

export class BleHandler
{
    constructor()
    {
        this.bluetoothManager = new BleManager();
        this.SERVICE_UUID =                 'ffffffff-ffff-ffff-ffff-fffffffffff0';
        this.LOCATION_POINTS_UUID =         'ffffffff-ffff-ffff-ffff-fffffffffff1';
        this.LOCATION_DESCRIPTIONS_UUID =   'ffffffff-ffff-ffff-ffff-fffffffffff2';
        this.MAP_IMAGE_UUID =               'ffffffff-ffff-ffff-ffff-fffffffffff3';
        this.device = null;
        this.currentNameIdentifier = null;

        this.signalBeaconsDictionary = {};
        this.dataBeaconsDictionary = {};
    }

    cleanUp()
    {
        this.bluetoothManager.destroy();
    }

    startScanning()
    {
        const subscription = this.bluetoothManager.onStateChange((state) =>
        {
            if(state === 'PoweredOn')
            {
                this.scanForDataBeacons();
                subscription.remove();
            }
        }, true);
    }

    //Scans for all devices with the name TS_... whose RSSI and position value can be used to calculate a position
    scanForSignalBeacons()
    {
        this.device.cancelConnection().then(function(){
            this.bluetoothManager.startDeviceScan(null, null, function(error, device)
            {
                if(error)
                {
                    console.log(error.message);
                    //Stop scanning if an error occurs
                    return;
                }

                //Check if the device is a true spot signal beacon
                if(device.name != null && device.name.startsWith('TS_'))
                {
                    //Get the unique name of the beacon array
                    let name = device.name.split('_')[2];
                    //Check if the TS beacon to connect to has the correct unique identifier name
                    if(name == this.currentNameIdentifier)
                    {
                        this.signalBeaconsDictionary[device.id] = device;
                    }
                }
            }.bind(this));
        }.bind(this));
    }

    //Scans for all devices with the name TS_DataBeacon_... and adds them to the list and calling the callback function when one is added
    scanForDataBeacons(callback)
    {
        //Every two seconds, clear the data beacon list so that beacons no longer in range will not be detected
        this.dataBeaconClearInterval = setInterval(function()
        {
            this.dataBeaconsDictionary = {};
        }.bind(this), 2000);

        this.bluetoothManager.startDeviceScan(null, null, function(error, device)
        {
            if(error)
            {
                console.log(error.message);
                //Stop scanning if an error occurs
                return;
            }

            //Check if the device is a true spot data beacon that can be connected to
            if(device.name != null && device.name.startsWith('TS_DataBeacon_'))
            {
                //Checks if a device with the given name has already been added to the dictionary
                if(device.name in this.dataBeaconsDictionary)
                {
                    //Checks if the device we are checking is already added to the dictionary 
                    if(device.id != this.dataBeaconsDictionary[''+device.name].id)
                    {
                        //Check if the rssi value is lower than the previous (rssi value is negative) if it is update the entry
                        if(device.rssi > this.dataBeaconsDictionary[''+device.name].rssi)
                        {
                            this.dataBeaconsDictionary[''+device.name] = device;
                            callback();
                        }
                    }
                }
                else
                {
                    this.dataBeaconsDictionary[''+device.name] = device;
                    callback();
                }
            }
        }.bind(this));
    }

    connectToDataBeacon(device, callback)
    {
        //Stop scanning for data beacons once you attempt to connect to a data beacon device
        this.bluetoothManager.stopDeviceScan();

        //Promise to connect to the device so we must wait to the promise is fullfilled using the .then
        device.connect({autoConnect: false, requestMTU: 512}).then(function(device)
        {
            console.log("The MTU is: " +device.mtu);
            let name = device.name.split("_")[2];
            console.log('Connecting to '+name+' Beacon!');
            //Retrieves all the services and characteristics the device supports, returns this as a promise so that they can be chained using the .then
            return device.discoverAllServicesAndCharacteristics();
        }).then(function(device)
        {
            //Sets the device as the current device
            this.device = device;
            this.currentNameIdentifier = device.name.split('_')[2];
            //Add the current beacon device to the signal array
            //this.signalBeaconArray.push(device);
            //Calls the callback function to alert that it has connected to a device
            callback();
        //In order to call functions from this class, this must be bound to the function because the scope of the function is within the context of device
        }.bind(this)).catch((error) =>
        {
            //Logs the error message if a promise does not resolve for any of the chained functions
            console.log(error.message);
        });
    }

    async readMapImageBase64()
    {
        if(this.device != null)
        {
            //Creates a promise that will be resolved once all the map data has been read from the notify characteristic
            let readDataPromise = new Promise(function (resolve, reject)
            {
                //Keeps track of the current position of data to be read into the array
                let arrayCounter = 0;
                //Array to hold all of the buffers for each base64 image data update
                let imageDataArray = new Array();
                //Subscribes to the notify characteristic for the map image to recieve data each time the map image data is sent
                var subscription = this.device.monitorCharacteristicForService(this.SERVICE_UUID, this.MAP_IMAGE_UUID, function(error, characteristic)
                {
                    if(error)
                    {
                        console.log("ERROR: " + error.message);
                        return;
                    }
                    //Read the map data sent from the characteristic as a base64 value
                    let characteristicValue = Buffer.from(characteristic.value, "base64");
                    //If only one byte is sent and the value of that byte is -127 in decimal, reslove this promise
                    if(characteristicValue.length === 1 && characteristicValue.readInt8() === -127)
                    {
                        //Resolves the promise and sends back the array with the subscription so the data stream can be closed for the map image, and send back the base64 buffer array
                        resolve([subscription, imageDataArray]);
                        //Stop execution of the function so that extra data does not corrupt the image data
                        return;
                    }
                    //Read the current buffer read into the buffer array
                    imageDataArray[arrayCounter] = characteristicValue;
                    arrayCounter++;
                }); 
            //this needs to be bound so that this.device can be accessed because the scope is within the promise function  
            }.bind(this));

            //stops execution of this function until the readDataPromise value is resolved
            var result = await readDataPromise;
            //removes this device from being subscribed to the map image data value
            result[0].remove();
            //takes all of the map image buffers in the returned map image buffer array and converts it into a single buffer
            var resultBuffer = Buffer.concat(result[1]);
            //writes the base64 map image string from the buffer and returns it map to the called function as the map image data
            return resultBuffer.toString();
        }

        console.log("ERROR: Attempting to access data when no connection was made with a device!");
        //return null if the device is not connected
        return null;
    }

    async readLocationsArray()
    {   
        //Ensure the device has been connect first before proceeding
        if(this.device != null)
        {
            //Retrieves the integerLocationCharacteristic from the device, function will wait at this point until data is retrieved because of await
            var integerLocationsCharacteristic = await this.device.readCharacteristicForService(this.SERVICE_UUID, this.LOCATION_POINTS_UUID);
            pointsLocationArray = this.readIntegerLocations(integerLocationsCharacteristic);

            //Retrieves the string descriptions characteristic for all locations from the device, the function will wait at this point until the data is recieved
            var stringDescriptionsCharacteristic = await this.device.readCharacteristicForService(this.SERVICE_UUID, this.LOCATION_DESCRIPTIONS_UUID);
            stringDescriptionsArray = this.readStringDescriptions(stringDescriptionsCharacteristic);

            return [pointsLocationArray, stringDescriptionsArray];
        }

        console.log("ERROR: Attempting to access data when no connection was made with a device!");
        //return null if the device is not connected
        return null;
    }

    readIntegerLocations(characteristic)
    {
        var locationArray = new Array();
        //Create a buffer from the base64 values recieved over bluetooth
        var value = Buffer.from(characteristic.value, "base64");
        //Each integer in the buffer is 4 bytes and each point contains an x and y value so we divide the buffer length by 8 to get the total number of points
        for(var i = 0; i < value.length / 8; i++)
        {
            //The start of each point data will be 8 bytes apart, 4 bytes for the x value plus 4 bytes for the y value
            var offset = i*8;
            //slice the data in the buffer to get the integer(4 bytes) x value
            var coordinateX = value.slice(offset, offset+4);
            //slice the data in the buffer to get the integer(4 bytes) y value
            var coordinateY = value.slice(offset+4, offset+8);
            //Read the results of the new buffers into unsigned integer for each coordinate to create a point
            locationArray[i] = new Point(coordinateX.readUInt32LE(), coordinateY.readUInt32LE());
        }
        return locationArray;
    }

    readStringDescriptions(characteristic)
    {
        var descriptionsArray = new Array();
        //Create a buffer from the base64 values recieved over bluetooth
        var value = Buffer.from(characteristic.value, 'base64');
        let i = 0;
        let arrayIndex = 0;
        while(i < value.length)
        {
            //the byte before each string holds a value of the size of that string
            let lengthBuffer = value.slice(i, i+1);
            //gives the amount of bytes to read to get the next string
            let stringLength = lengthBuffer.readInt8();
            //reads the string characters to a buffer based on the size of the string
            let stringBuffer = value.slice(i+1, i+1+stringLength);
            //Reads the characters in the array into an ascii string
            descriptionsArray[arrayIndex] = stringBuffer.toString('ascii');
            //Increment the array index to place the next string in the correct location
            arrayIndex++;
            //offset the next i value with 1 byte for the length and for the length in bytes of the string
            i = i+1+stringLength;
        }
        return descriptionsArray;
    }
}
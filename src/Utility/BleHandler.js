import { BleManager } from 'react-native-ble-plx'
import { Point } from './Point.js'
import { Buffer } from 'buffer'

export class BleHandler
{
    constructor()
    {
        this.bluetoothManager = new BleManager();
        this.SERVICE_UUID = 'ffffffff-ffff-ffff-ffff-fffffffffff0';
        this.device = null;
    }

    cleanUp()
    {
        this.bluetoothManager.destroy();
    }

    startScanning(callback)
    {
        const subscription = this.bluetoothManager.onStateChange((state) =>
        {
            if(state === 'PoweredOn')
            {
                this.scanAndConnect(callback);
                subscription.remove();
            }
        }, true);
    }

    scanAndConnect(callback)
    {
        this.bluetoothManager.startDeviceScan(null, null, (error, device) =>
        {
            if(error)
            {
                console.log(error.message);
                //Stop scanning if an error occurs
                return;
            }

            if(device.name === 'Raspberry PI Beacon')
            {
                //Stop scanning if we only want to connect to one device
                this.bluetoothManager.stopDeviceScan();

                //Promise to connect to the device so we must wait to the promise is fullfilled using the .then
                device.connect().then(function(device)
                {
                    console.log('Connecting to Raspberry PI Beacon!');
                    //Retrieves all the services and characteristics the device supports, returns this as a promise so that they can be chained using the .then
                    return device.discoverAllServicesAndCharacteristics();
                }).then(function(device)
                {
                    //Sets the device as the current device
                    this.device = device;
                    //Calls the callback function to alert that it has connected to a device
                    callback();
                //In order to call functions from this class, this must be bound to the function because the scope of the function is within the context of device
                }.bind(this)).catch((error) =>
                {
                    //Logs the error message if a promise does not resolve for any of the chained functions
                    console.log(error.message);
                });
            }
        });
    }

    //This function reads a large chunk of data by writing offsets back to the peripheral to use for the next read
    async readLargeData(serviceUUID, characteristicUUID, writeCharacteristicUUID)
    {
        var dataCharacteristic = await this.device.readCharacteristicForService(serviceUUID, characteristicUUID);
        //Keep a buffer that will eventually contain the full data value
        var fullData;
        //If the data size is equal to 512 bytes, there is more data to recieve
        while(dataCharacteristic.value.length === 512)
        {
            //Combines the data of both buffers
            fullData = Buffer.concat([fullData, dataCharacteristic.value.slice(0, 511)]);
            let remainingDataBuffer = dataCharacteristic.value.slice(511, 512);
            //Read the integer value for the last byte to see if there is more data to recieve
            let remainingDataLength = remainingDataBuffer.readUInt8();
            //If the remaining data is not equal to zero write the next offset to the peripheral and read more data
            if(remainingDataLength != 0)
            {   
                //0 indicates that the peripheral should not reset the offset for the data
                let writeData = Buffer.from(0);
                //Wait for a response from the characteristic that the write was successful
                await this.device.writeCharacteristicWithResponseForService(serviceUUID, writeCharacteristicUUID, writeData);
                //Request the next chunk of data
                dataCharacteristic = await this.device.readCharacteristicForService(serviceUUID, characteristicUUID);
            }
        }
         //1 indicates that the peripheral should reset the offset for the data
         let writeData = Buffer.from(1);
         //Wait for a response form the characteristic that the write was succesful
         await this.device.writeCharacteristicWithResponseForService(serviceUUID, writeCharacteristicUUID, writeData);

        //Append the last piece of data
        fullData = Buffer.concat([fullData, dataCharacteristic.value]);
        return fullData;
    };

    async readLocationsArray()
    {   
        //Ensure the device has been connect first before proceeding
        if(this.device != null)
        {
            //Retrieves the integerLocationCharacteristic from the device, function will wait at this point until data is retrieved because of await
            var integerLocationsCharacteristic = await this.device.readCharacteristicForService(this.SERVICE_UUID, 'ffffffff-ffff-ffff-ffff-fffffffffff3');
            pointsLocationArray = this.readIntegerLocations(integerLocationsCharacteristic);

            //Retrieves the string descriptions characteristic for all locations from the device, the function will wait at this point until the data is recieved
            var stringDescriptionsCharacteristic = await this.device.readCharacteristicForService(this.SERVICE_UUID, 'ffffffff-ffff-ffff-ffff-fffffffffff4');
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
            console.log(coordinateX.readUInt32LE() + ":" + coordinateY.readUInt32LE());
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
            console.log(descriptionsArray[arrayIndex]);
            //Increment the array index to place the next string in the correct location
            arrayIndex++;
            //offset the next i value with 1 byte for the length and for the length in bytes of the string
            i = i+1+stringLength;
        }
        return descriptionsArray;
    }
}
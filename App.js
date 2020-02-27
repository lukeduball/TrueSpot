import React, { Component } from 'react';
import { StyleSheet, View} from 'react-native';
import { MapImage } from './src/MapImage.js';
import { BleManager } from 'react-native-ble-plx'
import { Buffer } from 'buffer'
import { RotationGestureHandler } from 'react-native-gesture-handler';

export default class App extends Component
{
  constructor()
  {
    super();
    this.bluetoothManager = new BleManager();
  }

  componentDidMount()
  {
    const subscription = this.bluetoothManager.onStateChange((state) => 
    {
      if(state === 'PoweredOn')
      {
        this.scanAndConnect();
        subscription.remove();
      }
    }, true);
  }

  componentWillUnmount()
  {
    this.bluetoothManager.destroy();
  }

  async connectDeviceAndServices(device)
  {
      const connectedDevice = await device.connect();
      const services = await connectedDevice.discoverAllServicesAndCharacteristics();
      var serviceUUID = 'ffffffff-ffff-ffff-ffff-fffffffffff0';
      //Setup notify characteristic
      services.monitorCharacteristicForService(serviceUUID, 'ffffffff-ffff-ffff-ffff-fffffffffff5', (error, characteristic) =>
      {
        if(error)
        {
          this.error(error.message);
          return;
        }
        var value = Buffer.from(characteristic.value, "base64");
        var number = value.readInt32LE();
        console.log("Notify Update: "+number);
      });
  }

  modifyNotifyValues(error, characteristic)
  {
    if(error)
    {
      console.log(error.message);
      return;
    }
    var value = Buffer.from(characteristic.value, "base64");
    var number = value.readInt32LE();
    console.log("Notify Update: "+number);
  }

  readDynamicReadValue(device, serviceUUID)
  {
    device.readCharacteristicForService(serviceUUID, 'ffffffff-ffff-ffff-ffff-fffffffffff2').then(function(characteristic)
    {
      var value = Buffer.from(characteristic.value, "base64");
      var string = value.toString('ascii');
      console.log("Dynamic Read Value: "+string);
    });
  }

  readLongDynamicValue(device, serviceUUID)
  {
    device.readCharacteristicForService(serviceUUID, 'ffffffff-ffff-ffff-ffff-fffffffffff3').then(function(characteristic)
    {
      var value = Buffer.from(characteristic.value, "base64");
      console.log("Dynamic Long Read Value: "+characteristic.value);
    });
  }

  scanAndConnect()
  {
    this.bluetoothManager.startDeviceScan(null, null, (error, device) => 
    {
      if(error)
      {
        console.log(error.message);
        //Handle errors here (this will stop the scanning)
        return;
      }

      //Check if it is a device you are looking for based on its advertised data
      if(device.name === 'Raspberry PI Beacon')
      {
        //Stop scanning if you are looking for one device
        this.bluetoothManager.stopDeviceScan();
        //Proceed with the connection
        
        device.connect()
          .then(function(device)
          {
            console.log('Connecting to Raspberry PI Beacon!');
            return device.discoverAllServicesAndCharacteristics();
          })
          .then(function(device)
          {
                var serviceUUID = 'ffffffff-ffff-ffff-ffff-fffffffffff0';
                this.readDynamicReadValue(device, serviceUUID);
                this.readLongDynamicValue(device, serviceUUID);
                //var dynamicLongCharacteristic = device.readCharacteristicForService(serviceUUID, 'ffffffffffffffffffffffffffffff3');
                //console.log("Dynamic Long Read Value: " + dynamicLongCharacteristic.value);

                //Setup notify characteristic by calling the modifyNotifyValues function with the error and characteristic data passed
                device.monitorCharacteristicForService(serviceUUID, 'ffffffff-ffff-ffff-ffff-fffffffffff5', (error, characteristic) => this.modifyNotifyValues(error, characteristic));
          //Required to bind the 'this' otherwise it will not be in scope and cause an undefined error when calling a function
          }.bind(this))
          .catch((error) =>
          {
            console.log(""+ error);
            //Handle errors
          })
      }
    });
  }

  render()
  {
    return (
      <View>
        <MapImage/>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    backgroundColor: '#cc0000',
    width: 200,
    height: 200,
    borderRadius: 5,
  }
});

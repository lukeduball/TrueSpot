import React, { Component } from 'react';
import { StyleSheet, View} from 'react-native';
import { MapImage } from './src/MapImage.js';
import { Buffer } from 'buffer'
import { RotationGestureHandler } from 'react-native-gesture-handler';
import { BleHandler } from './src/Utility/BleHandler.js'

export default class App extends Component
{
  constructor()
  {
    super();
    this.bleHandler = new BleHandler();
    this.state = {
      locationsArray: new Array(),
      descriptionsArray: new Array()
    };
  }

  componentDidMount()
  {
    //Start scanning for devices and register onBeaconDeviceConnected as the callback once connected to a device
    this.bleHandler.startScanning(this.onBeaconDeviceConnected);
  }

  componentWillUnmount()
  {
    this.bleHandler.cleanUp();
  }

  //this function is called once connected to a peripheral beacon
  async onBeaconDeviceConnected()
  {
    //Gets the location data as an array with point data first and the string descriptions second
    let locationsData = await this.bleHandler.readLocationsArray();
    this.setState({locationsArray: locationsData[0], descriptionsArray: locationsData[1]});
    console.log("Callback function called");
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
        <MapImage locationsArray={this.state.locationsArray} descriptionsArray={this.state.descriptionsArray} />
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

import React, { Component } from 'react';
import { StyleSheet, View} from 'react-native';
import { MapImage } from './src/MapImage.js';
import { BleManager } from 'react-native-ble-plx'

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

      console.log(device.id + ": " + device.name + ": "+device.localName);

      //Check if it is a device you are looking for based on its advertised data
      if(device.name === 'TI BLE Sensor Tag' || device.name === 'SensorTag')
      {
        //Stop scanning if you are looking for one device
        this.bluetoothManager.stopDeviceScan();

        //Proceed with the connection
        device.connect()
          .then((device) =>
          {
            return device.discoverAllServicesAndCharacteristics();
          })
          .then((device) =>
          {
            //Do work with services and characteristics
          })
          .catch((error) =>
          {
            console.log("Error Connecting to Device!");
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

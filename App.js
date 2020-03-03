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
    this.bleHandler.startScanning(this.onBeaconDeviceConnected.bind(this));
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

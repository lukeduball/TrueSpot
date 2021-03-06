import React, { Component } from 'react';
import { StyleSheet, View, Text} from 'react-native';
import { MapImage } from './src/MapImage.js';
import { RotationGestureHandler } from 'react-native-gesture-handler';
import { BleHandler } from './src/Utility/BleHandler.js'
import { LoadingScreen } from './src/LoadingScreen.js'
import { ScanningScreen } from './src/ScanningScreen'

export default class App extends Component
{
  constructor()
  {
    super();

    this.bleHandler = new BleHandler();
    this.state = {
      componentToRender: <ScanningScreen bleHandler={this.bleHandler} connectToDeviceCallback={this.connectToDataBeacon.bind(this)}/>
    };
  }

  componentDidMount()
  {

  }

  componentWillUnmount()
  {
    this.bleHandler.cleanUp();
  }

  connectToDataBeacon(device)
  {
    //Tells the bleHandler to attempt to connect to the specified beacon
    this.bleHandler.connectToDataBeacon(device, this.onBeaconDeviceConnected.bind(this));
    //Changes the render component to show the loading screen while passing data
    this.setState({componentToRender: <LoadingScreen/>});
  }

  //this function is called once connected to a peripheral beacon
  async onBeaconDeviceConnected()
  {
    //Gets the location data as an array with point data first and the string descriptions second
    let mapData = await this.bleHandler.readMapImageBase64();
    let meterToPixelData = await this.bleHandler.readMeterToPixelRatio();
    let locationsData = await this.bleHandler.readLocationsArray();
    this.setState({componentToRender: <MapImage base64ImageData={mapData} meterToPixelRatio={meterToPixelData} locationsArray={locationsData[0]} descriptionsArray={locationsData[1]} bleHandler={this.bleHandler} />});
    //Needs to be after all the data is sent so that the device can be disconnected to only use its advertised data
    this.bleHandler.scanForSignalBeacons();
  }

  render()
  {
    return (
      this.state.componentToRender
    );
  }
}

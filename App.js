import React, { Component } from 'react';
import { Image, StyleSheet, Text, View, Dimensions } from 'react-native';
import {MapImage} from './src/MapImage.js';

export default class App extends Component
{
  render()
  {
    return (
      <MapImage onPress={() => console.log('Double Tap')} numberOfTouches={2}>
      </MapImage>
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

import React, { Component } from 'react';
import { Image, StyleSheet, Text, View, Dimensions } from 'react-native';

class MapImage extends Component
{
  static defaultProps =
  {
    onPress: () => null,
    numberOfTouches: 2,
    screenWidth: Math.round(Dimensions.get('window').width),
    maxWidth: 1473*2
  };

  constructor(props)
  {
    super(props);
    var w = 1473;
    var x = (this.props.screenWidth - w) / 2;
    this.state = {xPos: x,
                  yPos: 0,
                  width: w, 
                  height: 1652, 
                  rotation: 0, 
                  lastTouchDistance: 0.0, 
                  lastPanX: 0, 
                  lastPanY: 0};
  }

  onStartShouldSetResponder = (evt) =>
  {
    if(evt.nativeEvent.touches.length == 2)
    {
      var touchDiffX = evt.nativeEvent.touches[0].locationX - evt.nativeEvent.touches[1].locationX;
      var touchDiffY = evt.nativeEvent.touches[0].locationY - evt.nativeEvent.touches[1].locationY;
      var distance = Math.sqrt(touchDiffX * touchDiffX + touchDiffY * touchDiffY);
      this.setState({lastTouchDistance: distance})
      return true;
    }
    else if(evt.nativeEvent.touches.length == 1)
    {
      this.setState({lastPanX : evt.nativeEvent.touches[0].locationX, lastPanY: evt.nativeEvent.touches[0].locationY});
      return true;
    }

    return false;
  }

  onResponderMove = (evt) =>
  {
    if(evt.nativeEvent.touches.length == 2)
    {
      var touchDiffX = evt.nativeEvent.touches[0].locationX - evt.nativeEvent.touches[1].locationX;
      var touchDiffY = evt.nativeEvent.touches[0].locationY - evt.nativeEvent.touches[1].locationY;
      var distance = Math.sqrt(touchDiffX * touchDiffX + touchDiffY * touchDiffY);
      var zoom = distance / this.state.lastTouchDistance;
      var newWidth = this.state.width * zoom;
      var newHeight = this.state.height * zoom;
      if(newWidth < this.props.screenWidth)
      {
        var ratio = newHeight / newWidth;
        newWidth = this.props.screenWidth;
        newHeight = ratio * newWidth;
      }
      else if(newWidth > this.props.maxWidth)
      {
        var ratio = newHeight / newWidth;
        newWidth = this.props.maxWidth;
        newHeight = ratio * newWidth;
      }
      this.setState({width: newWidth, height: newHeight, lastTouchDistance: distance});
    }
    else if(evt.nativeEvent.touches.length == 1)
    {
      var diffX = evt.nativeEvent.touches[0].locationX - this.state.lastPanX;
      var diffY = evt.nativeEvent.touches[0].locationY - this.state.lastPanY;
      var dampner = 1.0;
      this.setState({xPos: this.state.xPos + diffX,
                     yPos: this.state.yPos + diffY,
      });
      console.log('Pan X: ' + diffX + ' Y: ' + diffY);
    }
  }

  onResponderRelease = (evt) => 
  {
    this.props.onPress();
  }

  render()
  {
    return (
      <View
        onStartShouldSetResponder={this.onStartShouldSetResponder}
        onResponderMove={this.onResponderMove}
        onResponderRelease={this.onResponderRelease}>
          {this.props.children}
        <Image
          style = {{
          top: this.state.xPos,
          left: this.state.yPos,
          width: this.state.width,
          height: this.state.height,
          transform: [{rotate: this.state.rotation+'deg'}],
        }}
        source = {require('./assets/floorplan.jpg')}
        />
      </View>
    )
  }
}

export default class App extends Component
{
  render()
  {
    return (
      <View style={styles.container}>
        <MapImage onPress={() => console.log('Double Tap')} numberOfTouches={2}>
        </MapImage>
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

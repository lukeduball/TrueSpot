import React, { Component } from 'react';
import { Image, StyleSheet, Text, View, Dimensions } from 'react-native';

class MapImage extends Component
{
  static defaultProps =
  {
    onPress: () => null,
    numberOfTouches: 2,
  };

  constructor(props)
  {
    super(props);
    this.lastTouchDistance = 0.0;
    this.lastPanX = 0;
    this.lastPanY = 0;
    this.screenWidth = Math.round(Dimensions.get('window').width);
    this.screenHeight = Math.round(Dimensions.get('window').height);
    this.maxWidth = 1473 * 2;
    var w = 1473;
    var x = 0; 
    //(this.screenWidth - w) / 2;
    this.state = {xPos: x,
                  yPos: 0,
                  width: w, 
                  height: 1652, 
                  rotation: 0};
  }

  onStartShouldSetResponder = (evt) =>
  {
    if(evt.nativeEvent.touches.length == 2)
    {
      var touchDiffX = evt.nativeEvent.touches[0].locationX - evt.nativeEvent.touches[1].locationX;
      var touchDiffY = evt.nativeEvent.touches[0].locationY - evt.nativeEvent.touches[1].locationY;
      var distance = Math.sqrt(touchDiffX * touchDiffX + touchDiffY * touchDiffY);
      this.lastTouchDistance = distance;
      return true;
    }
    else if(evt.nativeEvent.touches.length == 1)
    {
      this.lastPanX = evt.nativeEvent.touches[0].locationX;
      this.lastPanY = evt.nativeEvent.touches[0].locationY;
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
      if(this.lastTouchDistance === 0)
      {
        return;
      }
      var zoom = distance / this.lastTouchDistance;
      var newWidth = this.state.width * zoom;
      var newHeight = this.state.height * zoom;
      if(newWidth < this.screenWidth)
      {
        var ratio = newHeight / newWidth;
        newWidth = this.screenWidth;
        newHeight = ratio * newWidth;
      }
      else if(newWidth > this.maxWidth)
      {
        var ratio = newHeight / newWidth;
        newWidth = this.maxWidth;
        newHeight = ratio * newWidth;
      }
      this.lastTouchDistance = distance;
      this.setState({width: newWidth, height: newHeight});
    }
    else if(evt.nativeEvent.touches.length == 1)
    {
      var diffX = evt.nativeEvent.touches[0].locationX - this.lastPanX;
      var diffY = evt.nativeEvent.touches[0].locationY - this.lastPanY;
      var dampner = 0.5;
      var newXPos = this.state.xPos + diffX * dampner;
      var newYPos = this.state.yPos + diffY * dampner;
      //Condition so there is no blank space on the right of the screen when the image is moved
      if(newXPos + this.state.width < this.screenWidth)
      {
        newXPos = this.screenWidth - this.state.width;
      }
      //Condition to check if the image leaves blank space on the left of the screen
      if(newXPos > 0)
      {
        newXPos = 0;
      }

      if(newYPos > 0)
      {
        newYPos = 0;
      }
      //TODO:: Add conditions to check for Y lower bound conditions

      this.setState({xPos: newXPos,
                     yPos: newYPos,
      });
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
          position : 'absolute',
          top: this.state.yPos,
          left: this.state.xPos,
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

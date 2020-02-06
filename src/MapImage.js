import React, { Component } from 'react';
import { Image, View, Dimensions, PanResponder } from 'react-native';
import {LocationOverlay} from './LocationOverlay.js'

export class MapImage extends Component
{

  constructor(props)
  {
    super(props);

    this.lastTouchDistance = null;
    this.screenTouchX = null;
    this.screenTouchY = null;
    this.imageCoordX = null;
    this.imageCoordY = null;
    this.lastPanX = null;
    this.lastPanY = null;
    this.screenWidth = Math.round(Dimensions.get('window').width);
    this.screenHeight = Math.round(Dimensions.get('window').height);
    this.NORMAL_IMAGE_WIDTH = 1473;
    this.NORMAL_IMAGE_HEIGHT = 1652;
    this.maxWidth = 1473 * 2;
    var w = this.NORMAL_IMAGE_WIDTH;
    var x = (this.screenWidth - w) / 2; 
    var y = 0;

    this.state = {xPos: x,
                  yPos: y,
                  width: w, 
                  height: this.NORMAL_IMAGE_HEIGHT};

    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,

      onPanResponderGrant: (evt, gestureState) =>
      {

      },
      onPanResponderMove: (evt, gestureState) => 
      {
        if(gestureState.numberActiveTouches == 2)
        {
          this.processPinchZoom(evt, gestureState);
        }
        else if(gestureState.numberActiveTouches == 1)
        {
          this.processPanImage(evt, gestureState);
        }
      },
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderRelease: (evt, gestureState) => 
      {
        this.screenTouchX = null;
        this.screenTouchY = null;
        this.imageCoordX = null;
        this.imageCoordY = null;
        this.lastTouchDistance = null;
        this.lastPanX = null;
        this.lastPanY = null;
      },
      onPanResponderTerminate: (evt, gestureState) =>
      {

      },
      onShouldBlockNativeResponder: (evt, gestureState) =>
      {
        return true;
      }
    });
  }

  processPinchZoom(evt, gestureState)
  {
    var touchDiffX = evt.nativeEvent.touches[0].pageX - evt.nativeEvent.touches[1].pageX;
    var touchDiffY = evt.nativeEvent.touches[0].pageY - evt.nativeEvent.touches[1].pageY;
    var distance = Math.sqrt((touchDiffX * touchDiffX) + (touchDiffY * touchDiffY));

    if(this.lastTouchDistance == null)
    {
      this.lastTouchDistance = distance;
      return;
    }

    if(this.screenTouchX == null || this.screenTouchY == null || this.imageCoordX == null || this.imageCoordY == null)
    {
      this.screenTouchX = ((evt.nativeEvent.touches[0].locationX + this.state.xPos) + (evt.nativeEvent.touches[1].locationX + this.state.xPos)) / 2.0;
      this.screenTouchY = ((evt.nativeEvent.touches[0].locationY + this.state.yPos) + (evt.nativeEvent.touches[1].locationY + this.state.yPos)) / 2.0;
      //Converts the touch coordiantes into a image based coordinate
      this.imageCoordX = this.getImageSpaceXLocation(this.state.width, this.screenTouchX);
      this.imageCoordY = this.getImageSpaceYLocation(this.state.height, this.screenTouchY);
    }

    var zoom = distance / this.lastTouchDistance;
    var newWidth = this.state.width * zoom;
    var newHeight = this.state.height * zoom;
    //Ensures the width of the image can not be less than the screen width while keeping the aspect ratio with the height
    if(newWidth < this.screenWidth)
    {
      var ratio = newHeight / newWidth;
      newWidth = this.screenWidth;
      newHeight = ratio * newWidth;
    }
    //Ensures the width of the image can not be greater than the max width specified while keeping the aspect ratio with the height
    else if(newWidth > this.maxWidth)
    {
      var ratio = newHeight / newWidth;
      newWidth = this.maxWidth;
      newHeight = ratio * newWidth;
    }

    //Gets the new position of the image to keep the image coordinate at the same touch location on the screen
    var newXPos = this.getScaledXPosLocation(newWidth, this.imageCoordX, this.screenTouchX);
    var newYPos = this.getScaledYPosLocation(newHeight, this.imageCoordY, this.screenTouchY);

    //Ensure that when applying the new location that the image stays on the screen without leaving blank space
    newXPos = this.clampImageXToScreen(newXPos);
    newYPos = this.clampImageYToScreen(newYPos);
      
    this.lastTouchDistance = distance;
    this.setState({width: newWidth, height: newHeight, xPos: newXPos, yPos: newYPos});
  }

  processPanImage(evt, gestureState)
  {
    if(this.lastPanX == null || this.lastPanY == null)
    {
      this.lastPanX = evt.nativeEvent.touches[0].locationX;
      this.lastPanY = evt.nativeEvent.touches[0].locationY;
      return;
    }
    var diffX = evt.nativeEvent.touches[0].locationX - this.lastPanX;
    var diffY = evt.nativeEvent.touches[0].locationY - this.lastPanY;
    var dampner = 0.5;
    var newXPos = this.state.xPos + diffX * dampner;
    var newYPos = this.state.yPos + diffY * dampner;
    //Keeps map image from leaving blank space on the left and right of the screen
    newXPos = this.clampImageXToScreen(newXPos);
    newYPos = this.clampImageYToScreen(newYPos);

    this.setState({xPos: newXPos,
               yPos: newYPos,
    });
  }

  getImageSpaceXLocation(wth, screenX)
  {
    var coordX = ((screenX - this.state.xPos) * this.NORMAL_IMAGE_WIDTH) / wth;
    return coordX;
  }

  getImageSpaceYLocation(hght, screenY)
  {
    var coordY = ((screenY - this.state.yPos) * this.NORMAL_IMAGE_HEIGHT) / hght;
    return coordY;
  }

  //This function takes an X Location that is converted to image coordinates
  getScaledXPosLocation(wth, xLoc, screenX)
  {
    var scale = wth / this.NORMAL_IMAGE_WIDTH;
    var newXPos = screenX - xLoc * scale;
    return newXPos;
  }

  //This function takes a Y location that is converted to image coordinates
  getScaledYPosLocation(hght, yLoc, screenY)
  {
    var scale = hght / this.NORMAL_IMAGE_HEIGHT;
    var newYPos = screenY - yLoc * scale;
    return newYPos;
  }

  clampImageXToScreen(newXPos)
  {
    var val = newXPos;
    //Condition so there is no blank space on the right of the screen when the image is moved
    if(newXPos + this.state.width < this.screenWidth)
    {
      val = this.screenWidth - this.state.width;
    }
    //Condition to check if the image leaves blank space on the left of the screen
    if(newXPos > 0)
    {
      val = 0;
    }

    return val;
  }

  clampImageYToScreen(newYPos)
  {
    var val = newYPos;
    if(newYPos > 0)
    {
      val = 0;
    }
    //TODO:: Add conditions to check for Y lower bound conditions
    return val;
  }

  render()
  {
    return (
      <View
        {...this._panResponder.panHandlers}>
        <Image
          style = {{
          position : 'absolute',
          top: this.state.yPos,
          left: this.state.xPos,
          width: this.state.width,
          height: this.state.height,
        }}
        source = {require('../assets/floorplan.jpg')}
        />
        <LocationOverlay 
          parentXPos = {this.state.xPos}
          parentYPos = {this.state.yPos}
          parentHeight = {this.state.height}
          parentWidth = {this.state.width}
          defaultParentWidth = {this.NORMAL_IMAGE_WIDTH}
          defaultParentHeight = {this.NORMAL_IMAGE_HEIGHT}
          imageLocationX = {630}
          imageLocationY = {420}
          locationName = 'Bedroom Door'/>
      </View>
    )
  }
}
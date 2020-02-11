import React, { Component } from 'react';
import { Image, View, Dimensions, PanResponder } from 'react-native';
import {LocationOverlay} from './LocationOverlay.js'
import {Point} from './Utility/Point'

export class MapImage extends Component
{

  constructor(props)
  {
    super(props);

    this.lastNumberOfTouches = null;
    this.lastTouchDistance = null;
    this.screenTouch = null;
    this.imageCoords = null;
    this.lastPan = null;
    this.screenWidth = Math.round(Dimensions.get('window').width);
    this.screenHeight = Math.round(Dimensions.get('window').height);
    this.NORMAL_IMAGE_WIDTH = 1473;
    this.NORMAL_IMAGE_HEIGHT = 1652;
    this.maxWidth = 1473 * 2;
    var w = this.NORMAL_IMAGE_WIDTH;
    var x = (this.screenWidth - w) / 2; 
    var y = 0;

    this.state = {position: new Point(x, y),
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
        //Checks if the number of touches have changed since the last frame so variables states don't cause unexspected behavior 
        if(this.lastNumberOfTouches != gestureState.numberActiveTouches)
        {
          this.resetPanAndZoomVars();
        }

        this.lastNumberOfTouches = gestureState.numberActiveTouches;
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
        this.resetPanAndZoomVars();
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

  resetPanAndZoomVars()
  {
    this.screenTouch = null;
    this.imageCoords = null;
    this.lastTouchDistance = null;
    this.lastPan = null;
  }

  processPinchZoom(evt, gestureState)
  {
    var screenTouch1 = new Point(evt.nativeEvent.touches[0].pageX, evt.nativeEvent.touches[0].pageY);
    var screenTouch2 = new Point(evt.nativeEvent.touches[1].pageX, evt.nativeEvent.touches[1].pageY);
    var touchDiff = screenTouch1.subtract(screenTouch2);
    var distance = Math.sqrt((touchDiff.x * touchDiff.x) + (touchDiff.y * touchDiff.y));

    if(this.lastTouchDistance == null)
    {
      this.lastTouchDistance = distance;
      return;
    }

    if(this.screenTouch == null || this.imageCoords == null)
    {
      //Calculates the point on the screen that is midway between both touches
      this.screenTouch = screenTouch1.add(screenTouch2).multiply(0.5);
      //Converts the touch coordiantes into a image based coordinate
      this.imageCoords = this.getImageSpaceLocation(this.state.width, this.state.height, this.screenTouch);
      return;
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
    var newPos = this.getScaledLocation(newWidth, newHeight, this.imageCoords, this.screenTouch);

    //Ensure that when applying the new location that the image stays on the screen without leaving blank space
    newPos = this.clampImageToScreen(newPos);
      
    this.lastTouchDistance = distance;
    this.setState({width: newWidth, height: newHeight, position: newPos});
  }

  processPanImage(evt, gestureState)
  {
    if(this.lastPan == null)
    {
      var lastPanX = evt.nativeEvent.touches[0].locationX;
      var lastPanY = evt.nativeEvent.touches[0].locationY;
      this.lastPan = new Point(lastPanX, lastPanY);
      return;
    }
    var touchPoint = new Point(evt.nativeEvent.touches[0].locationX, evt.nativeEvent.touches[0].locationY);
    var diff = touchPoint.subtract(this.lastPan);
    var dampner = 0.5;
    diff = diff.multiply(dampner);
    var newPos = this.state.position.add(diff);
    //Keeps map image from leaving blank space on the left and right of the screen
    newPos = this.clampImageToScreen(newPos);

    this.setState({position : newPos});
  }

  //Converts the screen position to a local image location
  getImageSpaceLocation(wth, hght, screenPoint)
  {
    var coords = screenPoint.subtract(this.state.position);
    coords.x *= this.NORMAL_IMAGE_WIDTH / wth;
    coords.y *= this.NORMAL_IMAGE_HEIGHT / hght;
    return coords;
  }

  //Converts the image location to the proper x and y position to keep that point in the same position on the screen with a given width and height
  getScaledLocation(wth, hght, imagePoint, screenPoint)
  {
    var scaleX = wth / this.NORMAL_IMAGE_WIDTH;
    var newXPos = screenPoint.x - imagePoint.x * scaleX;
    var scaleY = hght / this.NORMAL_IMAGE_HEIGHT
    var newYPos = screenPoint.y - imagePoint.y * scaleY;
    return new Point(newXPos, newYPos);
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

  clampImageToScreen(newPos)
  {
    return new Point(this.clampImageXToScreen(newPos.x), this.clampImageYToScreen(newPos.y));
  }

  generateLocationComponent(imageLocation, name, key)
  {
    return <LocationOverlay 
            key = {key}
            parentPos = {this.state.position}
            parentHeight = {this.state.height}
            parentWidth = {this.state.width}
            defaultParentWidth = {this.NORMAL_IMAGE_WIDTH}
            defaultParentHeight = {this.NORMAL_IMAGE_HEIGHT}
            imageLocation = {imageLocation}
            locationName = {name}/>
  }

  render()
  {
    var LocationsArray = new Array();
    LocationsArray[0] = this.generateLocationComponent(new Point(630, 420), 'Bedroom Door', 0);
    LocationsArray[1] = this.generateLocationComponent(new Point(1000, 800), 'Location 2', 1);
    return (
      <View
        {...this._panResponder.panHandlers}>
        <Image
          style = {{
          position : 'absolute',
          left: this.state.position.x,
          top: this.state.position.y,
          width: this.state.width,
          height: this.state.height,
        }}
        source = {require('../assets/floorplan.jpg')}
        />
        {LocationsArray}
      </View>
    )
  }
}
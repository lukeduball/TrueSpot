import React, { Component } from 'react';
import { Image, View, Dimensions, PanResponder } from 'react-native';
import {LocationOverlay} from './LocationOverlay.js'
import {Point} from './Utility/Point'

export class MapImage extends Component
{
  //Contains the data recieved from bluetooth passed from the parent component
  static defaultProps = {
    //Image data in base64 format
    base64ImageData : null,
    //Contains point array of all the locaations on the map
    locationsArray: new Array(),
    //Contains the string descriptions of the locations on the map
    descriptionsArray: new Array(),
  };

  constructor(props)
  {
    super(props);
    //A null value for the following variables indicates that its event was not called last frame, this keeps old values from causing unpredictable results during events
    //keeps track of the last number of touches so data can be reset when going directly from one to two touches without affecting the pinchZoom and pan functions
    this.lastNumberOfTouches = null;
    //last distance between two fingers when pinch zooming
    this.lastTouchDistance = null;
    //pixel location on the screen between two fingers at the start of the pinch zoom
    this.screenTouch = null;
    //location in image coordinates where the screen touch was before zooming occured to allow centering on that point
    this.imageCoords = null;
    //location on the screen of the touch when the pan event is first called
    this.lastPan = null;
    
    //Gets the devices screen width and height in pixels
    this.screenWidth = Math.round(Dimensions.get('window').width);
    this.screenHeight = Math.round(Dimensions.get('window').height);

    //Keeps track of the unscaled image width and height of the map image
    this.NORMAL_IMAGE_WIDTH = 1;  
    this.NORMAL_IMAGE_HEIGHT = 1; 
    //The original image sizes used for reference are Width:1473 and Height:1652

    //Clamps how far an image can be zoomed in on
    this.maxWidth = 1;

    //Sets the initial state of this component
    this.state = {position: new Point(0, 0),
                  width: this.NORMAL_IMAGE_WIDTH, 
                  height: this.NORMAL_IMAGE_HEIGHT
                 };

    //Gets the image width and height from the base64 image data and updates the width and height information for the component
    Image.getSize('data:image/jpg;base64,'+this.props.base64ImageData, this.setupImageDimensions.bind(this));

    //this function registers functions for all touch events to be captured
    this.setupPanResponder();
  }

  //Sets up the component with the correct width and height for the downloaded map image
  setupImageDimensions(width, height)
  {
      this.NORMAL_IMAGE_WIDTH = width;
      this.NORMAL_IMAGE_HEIGHT = height;
      this.maxWidth = width * 2;

      //Places the x location of the image in the center of the screen
      var x = (this.screenWidth - this.NORMAL_IMAGE_WIDTH) / 2; 
      var y = 0;

      //Sets the initial state of this component once the width and height have been aquired from the image
      this.setState({position: new Point(x, y),
                  width: this.NORMAL_IMAGE_WIDTH, 
                  height: this.NORMAL_IMAGE_HEIGHT
                 });
  }

  //Sets up the pan responder to capture all touch events
  setupPanResponder()
  {
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,

      onPanResponderGrant: (evt, gestureState) =>
      {

      },
      //Called when touches are moved on the screen
      onPanResponderMove: (evt, gestureState) => 
      {
        //Checks if the number of touches have changed since the last frame so variables states don't cause unexspected behavior 
        if(this.lastNumberOfTouches != gestureState.numberActiveTouches)
        {
          this.resetPanAndZoomVars();
        }
        //sets the last number of touches to the current number of touches for comparison next time this fucntion is called
        this.lastNumberOfTouches = gestureState.numberActiveTouches;

        //If the number of touches on the screen is 2 call the pinch zoom event
        if(gestureState.numberActiveTouches == 2)
        {
          this.processPinchZoom(evt, gestureState);
        }
        //If the number of touches on the screen is 1 call the pan event
        else if(gestureState.numberActiveTouches == 1)
        {
          this.processPanImage(evt, gestureState);
        }
      },
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      //When there are no more touches on the screen this function is called
      onPanResponderRelease: (evt, gestureState) => 
      {
        //Resets the values of the pan and zoom values to null so they do not affect the next event
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

  //Reset all of the pinch and zoom event variables so they do not affect the next event
  resetPanAndZoomVars()
  {
    this.screenTouch = null;
    this.imageCoords = null;
    this.lastTouchDistance = null;
    this.lastPan = null;
  }

  //Perform a pinch zoom event for the current touches
  processPinchZoom(evt, gestureState)
  {
    //the first touch on the screen
    var screenTouch1 = new Point(evt.nativeEvent.touches[0].pageX, evt.nativeEvent.touches[0].pageY);
    //the second touch on the screen
    var screenTouch2 = new Point(evt.nativeEvent.touches[1].pageX, evt.nativeEvent.touches[1].pageY);
    //contains a point with the difference of the two touches
    var touchDiff = screenTouch1.subtract(screenTouch2);
    //calculate the distance of between the touches using the pythagorian theorem
    var distance = Math.sqrt((touchDiff.x * touchDiff.x) + (touchDiff.y * touchDiff.y));

    //If a pinch event was not called on the last frame set the first touch data and stop execution
    if(this.lastTouchDistance == null || this.screenTouch == null || this.imageCoords == null)
    {
      this.lastTouchDistance = distance;
       //Calculates the point on the screen that is midway between both touches
       this.screenTouch = screenTouch1.add(screenTouch2).multiply(0.5);
       //Converts the touch coordiantes into a image based coordinate
       this.imageCoords = this.getImageSpaceLocation(this.state.width, this.state.height, this.screenTouch);
      return;
    }

    //Calculates the amount zoom by getting a ratio of the current distance with the last touch distance
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
    newPos = this.clampImageToScreen(newPos, newWidth, newHeight);
      
    //set the last touch distance to the current touch distance to use next frame
    this.lastTouchDistance = distance;
    //update the state with the new width, height, and position. This function will recall the render function for this component
    this.setState({width: newWidth, height: newHeight, position: newPos});
  }

  //Performs a pan image event
  processPanImage(evt, gestureState)
  {
    //Get the touch location on the screen as a point
    var touchPoint = new Point(evt.nativeEvent.touches[0].locationX, evt.nativeEvent.touches[0].locationY);

    //If the last frame was not a pan event set the initial point reference for a pan event
    if(this.lastPan == null)
    {
      this.lastPan = new Point(touchPoint.x, touchPoint.y);
      return;
    }
    //Find the different between the current touch and the pan reference point
    var diff = touchPoint.subtract(this.lastPan);
    //Keeps the pan from moving too fast across the screen
    var dampner = 0.5;
    diff = diff.multiply(dampner);
    //Find the new image position by adding the dampened offset
    var newPos = this.state.position.add(diff);
    //Keeps map image from leaving blank space on the left and right of the screen
    newPos = this.clampImageToScreen(newPos, this.state.width, this.state.height);

    //Updates the component with a new position and recalls the render function
    this.setState({position : newPos});
  }

  //Converts the screen position to a local image location
  getImageSpaceLocation(wth, hght, screenPoint)
  {
    //Uses the ratio between the normal image component and the current image position to find the image coordinates
    var coords = screenPoint.subtract(this.state.position);
    coords.x *= this.NORMAL_IMAGE_WIDTH / wth;
    coords.y *= this.NORMAL_IMAGE_HEIGHT / hght;
    return coords;
  }

  //Converts the image location to the proper x and y position to keep that point in the same position on the screen with a given width and height
  getScaledLocation(wth, hght, imagePoint, screenPoint)
  {
    //Uses the ratio between normal width and height and a new width and height to find the proper screen position
    var scaleX = wth / this.NORMAL_IMAGE_WIDTH;
    var newXPos = screenPoint.x - imagePoint.x * scaleX;
    var scaleY = hght / this.NORMAL_IMAGE_HEIGHT
    var newYPos = screenPoint.y - imagePoint.y * scaleY;
    return new Point(newXPos, newYPos);
  }

  //Returns an x component of an image that is within the bounds of the screen
  clampImageXToScreen(newXPos, width)
  {
    var val = newXPos;
    //Condition so there is no blank space on the right of the screen when the image is moved
    if(newXPos + width < this.screenWidth)
    {
      val = this.screenWidth - width;
    }
    //Condition to check if the image leaves blank space on the left of the screen
    if(newXPos > 0)
    {
      val = 0;
    }

    return val;
  }

  //Returns a y component of the image that is within the bounds of the screen
  clampImageYToScreen(newYPos, height)
  {
    var val = newYPos;
    if(newYPos > 0)
    {
      val = 0;
    }
    //TODO:: Add conditions to check for Y lower bound conditions
    return val;
  }

  //Returns a point that is within the screen bounds for an image
  clampImageToScreen(newPos, width, height)
  {
    return new Point(this.clampImageXToScreen(newPos.x, width), this.clampImageYToScreen(newPos.y, height));
  }

  //returns a LocationOverlay component at the specified location with the specified name description
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
    //Generate the LocationsOverlay components for the passed location and description data
    var LocationsArray = new Array();
    for(var i = 0; i < this.props.locationsArray.length; i++)
    {
      LocationsArray[i] = this.generateLocationComponent(this.props.locationsArray[i], this.props.descriptionsArray[i], i);
    }
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
        source = {{uri:'data:image/jpg;base64,'+this.props.base64ImageData}}
        />
        {LocationsArray}
      </View>
    )
  }
}
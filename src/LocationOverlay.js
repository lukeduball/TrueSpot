import React, {Component} from 'react';
import {Image, View} from 'react-native';
import { isRequired } from 'react-native/Libraries/DeprecatedPropTypes/DeprecatedColorPropType';

export class LocationOverlay extends Component
{
    static def

    constructor(props)
    {
        super(props);

        //Create the default props which can be passed in when the component is created
        this.props = {
            imageLocationX : 0,
            imageLocationY : 0,
            locationName: 'Missing Name'
        };

        //Have an xPosition and yPosition for the state because these locations can change based on image scale
        this.state = {
            xPos: 0,
            yPos: 0,
            width: 50,
            height: 50
        };
    }

    render()
    {
        return(
            <Image 
            style = {{
                position : 'absolute',
                top: this.state.yPos,
                left: this.state.xPos,
                width: this.state.width,
                height: this.state.height,
              }}
            source = {require('../assets/locationMarker.png')}/>
            <Text>
                {this.props.locationName}
            </Text>
        )
    }
}
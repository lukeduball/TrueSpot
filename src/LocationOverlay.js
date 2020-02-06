import React, {Component} from 'react';
import {Image, View, Text} from 'react-native';

export class LocationOverlay extends Component
{
    //Props which can be specified at creation time to get overlay in the correct place
    static defaultProps = {
        parentXPos: 0,
        parentYPos: 0,
        parentHeight: 0,
        parentWidth: 0,
        defaultParentWidth: 0,
        defaultParentHeight: 0,
        imageLocationX: 0,
        imageLocationY: 0,
        locationName: 'Missing Name'
    }

    constructor(props)
    {
        super(props);

        this.NORMAL_HEIGHT = 50;
        this.NORMAL_WIDTH = 33;
    }

    getScaledCoordinate(parentPos, dimension, defaultDimension, imageCoordinate)
    {
        var loc = (imageCoordinate * dimension) / defaultDimension;
        return parentPos + loc;
    }

    getScaledSizeDimension(parentDimension, defaultParentDimension, defaultDimension)
    {
        var dimension = (defaultDimension * parentDimension) / defaultParentDimension;
        return dimension;
    }

    render()
    {
        return(
            <View
            style = {{
                position : 'absolute',
                top: this.getScaledCoordinate(this.props.parentYPos, this.props.parentHeight, this.props.defaultParentHeight, this.props.imageLocationY),
                left: this.getScaledCoordinate(this.props.parentXPos, this.props.parentWidth, this.props.defaultParentWidth, this.props.imageLocationX) - (this.getScaledSizeDimension(this.props.parentWidth, this.props.defaultParentWidth, this.NORMAL_WIDTH) * 4) / 2,
                width: this.getScaledSizeDimension(this.props.parentWidth, this.props.defaultParentWidth, this.NORMAL_WIDTH) * 4,
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <Image 
                style = {{
                    width: this.getScaledSizeDimension(this.props.parentWidth, this.props.defaultParentWidth, this.NORMAL_WIDTH),
                    height: this.getScaledSizeDimension(this.props.parentHeight, this.props.defaultParentHeight, this.NORMAL_HEIGHT),
                }}
                source = {require('../assets/locationMarker.png')}/>
                <Text adjustsFontSizeToFit minimumFontScale={0.1} numberOfLines={1}
                style = {{
                    textAlign : 'center',
                    textAlignVertical: 'center',
                }}>
                    {this.props.locationName}
                </Text>
            </View>
        )
    }
}
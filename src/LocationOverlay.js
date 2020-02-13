import React, {Component} from 'react';
import {Image, View, Text, Dimensions} from 'react-native';
import {Point} from './Utility/Point';

export class LocationOverlay extends Component
{
    //Props which can be specified at creation time to get overlay in the correct place
    static defaultProps = {
        parentPos : null,
        parentHeight: 0,
        parentWidth: 0,
        defaultParentWidth: 0,
        defaultParentHeight: 0,
        imageLocation: null,
        locationName: 'Missing Name',
    }

    constructor(props)
    {
        super(props);

        this.NORMAL_HEIGHT = 50;
        this.NORMAL_WIDTH = 33;
        //With a normal size, 15 is the desired font size. This value is used to adjust the font for different widths
        this.FONT_SIZE_ADJUSTER = this.props.defaultParentWidth / 15;
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
                left: this.getScaledCoordinate(this.props.parentPos.x, this.props.parentWidth, this.props.defaultParentWidth, this.props.imageLocation.x) - (this.getScaledSizeDimension(this.props.parentWidth, this.props.defaultParentWidth, this.NORMAL_WIDTH) * 4) / 2,
                top: this.getScaledCoordinate(this.props.parentPos.y, this.props.parentHeight, this.props.defaultParentHeight, this.props.imageLocation.y),
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
                <Text numberOfLines={1}
                style = {{
                    textAlign : 'center',
                    textAlignVertical: 'center',
                    fontSize: this.props.parentWidth / this.FONT_SIZE_ADJUSTER,
                }}>
                    {this.props.locationName}
                </Text>
            </View>
        )
    }
}
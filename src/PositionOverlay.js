import React, {Component} from 'react';
import {Image, View} from 'react-native';
import {Point} from './Utility/Point';
import {Buffer} from 'buffer'

export class PositionOverlay extends Component
{
    static defaultProps = {
        bleHandler: null,
        meterToPixelRatio: null,
        parentPos : null,
        parentHeight: 0,
        parentWidth: 0,
        defaultParentWidth: 0,
        defaultParentHeight: 0,
    }

    constructor(props)
    {
        super(props);

        this.NORMAL_SIZE = 33;

        //Sets the position marker to update every 200 ms
        setInterval(function()
        {
            for(const key in this.props.bleHandler.signalBeaconsDictionary)
            {
                if(this.props.bleHandler.signalBeaconsDictionary[key].device.rssi != this.props.bleHandler.signalBeaconsDictionary[key].lastRSSI)
                {
                    this.props.bleHandler.signalBeaconsDictionary[key].lastRSSI = this.props.bleHandler.signalBeaconsDictionary[key].device.rssi;
                    this.props.bleHandler.signalBeaconsDictionary[key].rssi = this.props.bleHandler.signalBeaconsDictionary[key].rssi * 0.7 + this.props.bleHandler.signalBeaconsDictionary[key].device.rssi * 0.3;
                }
            }
            this.forceUpdate();
        }.bind(this), 200);
    }

    //Returns the scaled coordinate by converting from local image space to screen space
    getScaledCoordinate(parentPos, dimension, defaultDimension, imageCoordinate)
    {
        var loc = (imageCoordinate * dimension) / defaultDimension;
        return parentPos + loc;
    }
    //Returns the scaled dimension size(width/height) for the current parent dimensions
    getScaledSizeDimension(parentDimension, defaultParentDimension, defaultDimension)
    {
        var dimension = (defaultDimension * parentDimension) / defaultParentDimension;
        return dimension;
    }

    render()
    {
        let beaconsArray = [];
        for(key in this.props.bleHandler.signalBeaconsDictionary)
        {
            beaconsArray.push(this.props.bleHandler.signalBeaconsDictionary[key]);
        }
        beaconsArray.sort(function(a, b)
        {
            return a.rssi < b.rssi;
        });

        if(beaconsArray.length >= 3)
        {
            let beacon1 = beaconsArray[0];
            let beacon2 = beaconsArray[1];
            let beacon3 = beaconsArray[2];
            let meterPosition = this.getPositionInMeters(beacon1, beacon2, beacon3);
            let renderPosition = meterPosition.multiply(this.props.meterToPixelRatio);
            return(
                <View>
                    <Image
                        style={{
                            left: this.getScaledCoordinate(this.props.parentPos.x, this.props.parentWidth, this.props.defaultParentWidth, renderPosition.x),
                            top: this.getScaledCoordinate(this.props.parentPos.y, this.props.parentHeight, this.props.defaultParentHeight, renderPosition.y),
                            width: this.getScaledSizeDimension(this.props.parentWidth, this.props.defaultParentWidth, this.NORMAL_SIZE),
                            height: this.getScaledSizeDimension(this.props.parentHeight, this.props.defaultParentHeight, this.NORMAL_SIZE)
                        }}
                        source={require('../assets/positionCircle.png')}/>
                </View>
            );
        }

        //If there are not three beacons, do not render anything
        return null;
    }

    getBeaconDistance(beacon, beaconRSSI)
    {
        //Calculate the exponant -- 3 represents a value that can be between 2 and 4 based on the environment
        let exponent = (beacon.txPowerLevel - beaconRSSI) / (10 * 4.5);
        //returns the distance calculated by 10 raised to the calculated exponent
        return Math.pow(10, exponent);
    }

    getBeaconLocation(beacon)
    {
        var x = 0, y = 0;
        for(const key in beacon.serviceData)
        {
            //Reads in the position value of the beacon from its advertising data
            let base64Value = beacon.serviceData[key];
            let buffer = new Buffer(base64Value, 'base64');
            //the x value is the first 4 bytes
            let xBuf = buffer.slice(0, 4);
            //the y value is the bytes 4 to 8
            let yBuf = buffer.slice(4, 8);
            x = xBuf.readFloatLE();
            y = yBuf.readFloatLE();
            console.log(x + ":" + y + ":"+beacon.id)
        }

        return new Point(x, y);
    }

    getPositionInMeters(b1, b2, b3)
    {
        //Gets the distance away from each beacon in meters
        let r1 = this.getBeaconDistance(b1.device, b1.rssi);
        let r2 = this.getBeaconDistance(b1.device, b2.rssi);
        let r3 = this.getBeaconDistance(b1.device, b3.rssi);

        let r1Squared = r1*r1;
        let r2Squared = r2*r2;
        let r3Squared = r3*r3;

        //Gets the position (x and y coordinate) of each beacon in meters
        let b1Position = this.getBeaconLocation(b1.device);
        let b1xSquared = b1Position.x * b1Position.x;
        let b1ySquared = b1Position.y * b1Position.y;
        let b2Position = this.getBeaconLocation(b2.device);
        let b2xSquared = b2Position.x * b2Position.x;
        let b2ySquared = b2Position.y * b2Position.y;
        let b3Position = this.getBeaconLocation(b3.device);
        let b3xSquared = b3Position.x * b3Position.x;
        let b3ySquared = b3Position.y * b3Position.y;

        //console.log("Radius:"+r1+":"+r2+":"+r3);

        //Solves the matrix equation of the overlapping circles of beacon 1 and 2 and beacons 2 and 3 to find the current position of the user
        let E12 = (r1Squared - r2Squared - b1xSquared + b2xSquared - b1ySquared + b2ySquared) / 2.0;
        let E23 = (r2Squared - r3Squared - b2xSquared + b3xSquared - b2ySquared + b3ySquared) / 2.0;

        let A = -b1Position.x + b2Position.x;
        let B = -b1Position.y + b2Position.y;
        let C = -b2Position.x + b3Position.x;
        let D = -b2Position.y + b3Position.y;

        let x = ((E12*D) + (-B*E23)) / (A*D - C*B);
        let y = ((-C*E12) + (A*E23)) / (A*D - C*B);

        return new Point(x, y);
    }
}
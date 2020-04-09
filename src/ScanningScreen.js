import React, { Component } from "react";
import {View, TouchableOpacity, FlatList, StyleSheet, Alert, Text } from 'react-native';

//Display component for each list item
function Item({name, device, pressFunction}) {
    return(
        <TouchableOpacity onPress={() => pressFunction(device)}
            style={styles.item}
        >
            <Text style={styles.text}>{name}</Text>
        </TouchableOpacity>
    );
}

export class ScanningScreen extends Component
{
    //Inherits a callback function and bleHandler from the parent component
    static defaultProps = {
        bleHandler: null,
        connectToDeviceCallback: null,
    }

    constructor(props)
    {
        super(props);

        //Start scanning for data beacon devices
        this.props.bleHandler.scanForDataBeacons(this.updateList.bind(this));

        //Every 2 seconds, the data beacons list is marked as stale, any already stale(disconnect or out of range) beacons are removed from the list
        this.dataBeaconClearInterval = setInterval(function()
        {
            this.props.bleHandler.markAndRemoveStaleDataBeacons(this.updateList.bind(this));
        }.bind(this), 2000);
    }

    componentWillUnmount()
    {
        //Stop the timer once this component is unmounted and no longer needed
        clearInterval(this.dataBeaconClearInterval);
    }

    //This is a callback function that will be called once a new beacon is added to the list
    updateList()
    {
        //Forces the components render function to run
        this.forceUpdate();
    }

    render()
    {
        //Puts all of the data beacons data into an array so it can be rendered in a list
        data = Array();
        const keys = Object.keys(this.props.bleHandler.dataBeaconsDictionary);
        for(const key of keys)
        {
            let device = this.props.bleHandler.dataBeaconsDictionary[key].device;
            //Removes the TS_DataBeacon_ to extract the unique part of the name
            let name = device.name.split("_")[2];
            data.push({key: name, device: device});
        }
        //Sorts the displayed list by the rssi value so the closest beacon is showed at the top
        data.sort(function(a, b)
        {
            return a['device'].rssi - b['device'].rssi;
        });

        return (
            <View style={styles.container}>
                <View style={styles.headerContainer}>
                    <Text style={styles.header}> Beacons </Text>
                </View>
                <View style={styles.listContainer}>
                    <FlatList
                        data={data}
                        renderItem={({item}) => (
                            <Item name={item.key} device={item.device} pressFunction={this.props.connectToDeviceCallback}/>
                        )}
                    />
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 0, 
    },
    item: {
        backgroundColor: '#000',
        borderWidth: 1,
        borderBottomColor: 'white',
        padding: 10,
    },
    text: {
        color: 'white',
        textAlignVertical: 'center'
    },
    listContainer:{
    },
    header: {
        fontSize: 40,
        textAlign: 'center'
    },
    headerContainer: {
        backgroundColor: 'white',
    }
});
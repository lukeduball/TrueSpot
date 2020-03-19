import React, { Component } from "react";
import {View, TouchableOpacity, FlatList, StyleSheet, Alert, Text } from 'react-native';

function Item({name}) {
    return(
        <TouchableOpacity onPress={() => Alert.alert(name+" Pressed")}
            style={styles.item}
        >
            <Text style={styles.text}>{name}</Text>
        </TouchableOpacity>
    );
}

export class ScanningScreen extends Component
{
    static defaultProps = {
        bleHandler: null
    }

    constructor(props)
    {
        super(props);

        //Start scanning for data beacon devices
        this.props.bleHandler.scanForDataBeacons(this.updateList.bind(this));
    }

    updateList()
    {
        this.forceUpdate();
    }

    render()
    {
        data = Array();
        const keys = Object.keys(this.props.bleHandler.dataBeaconsDictionary);
        for(const key of keys)
        {
            let device = this.props.bleHandler.dataBeaconsDictionary[key];
            let name = device.name.split("_")[2];
            data.push({key: name, device: device});
        }
        data.sort(function(a, b)
        {
            return a['device'].rssi - b['device'].rssi;
        });

        return (
            <View style={styles.container}>
                <FlatList
                    data={data}
                    renderItem={({item}) => (
                        <Item name={item.key}/>
                    )}
                />
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
        padding: 10
    },
    text: {
        color: 'white'
    } 
});
import React, { Component } from "react";
import {View, Text, Image} from 'react-native';

export class LoadingScreen extends Component
{
    constructor(props)
    {
        super(props);
    }

    render()
    {
        return(
            <View style={{flex: 1, 
                        alignItems: 'center', 
                        justifyContent: 'center'
            }}>
                <Image source={require('../assets/circleSpinner.gif')}/>
                <Text style={{fontSize : 20}}>
                    Loading...
                </Text>
            </View>
        )
    }
}
'use strict';

import React, { Component } from 'react';
import {
  Text,
  View,
  Dimensions,
  ScrollView,
  TouchableOpacity
} from 'react-native';

const {width, height} = Dimensions.get('window');

import {Video} from 'react-native-media-kit';

export default class App extends Component {

  state = {
    muted: false,
    width: width,
    height: width / (16/9),
    controls: true
  };

  render() {
    return (
      <ScrollView
        style={{flex: 1, backgroundColor: '#efefef'}}>


        <Video
          style={{width: this.state.width, height: this.state.height, marginTop: 50, backgroundColor: 'black'}}
          autoplay={false}
          preload='auto'
          loop={true}
          controls={this.state.controls}
          muted={this.state.muted}
          src={'http://192.168.100.18:3000/videos/SNH48%20-%20%E6%A2%A6%E6%83%B3%E5%B2%9B%20(Dream%20Land)%20MV.mp4'}
        />

        <View
          style={{flexDirection: 'row', height: 40}}>
          <TouchableOpacity
            onPress={() => {
              this.setState({
                muted: !this.state.muted
              })
            }}
            style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
            <Text>toggle muted</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              this.setState({
                width: 160,
                height: 90,
                controls: false
              })
            }}
            style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
            <Text>change layout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }
}
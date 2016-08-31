import React, { Component } from 'react';
import {
  BackAndroid,
  Dimensions,
  View,
  StatusBar
} from 'react-native';
import Orientation from 'react-native-orientation';
import { Video } from 'react-native-media-kit';

class Fullscreen extends Component {

  render() {
    const { currentState, currentTime } = this.props;

    if (currentState) {
      Orientation.lockToLandscape();
      const {
        width,
        height
      } = Dimensions.get('window');
      return (
        <View
          style={{
            width: height,
            height: width,
            backgroundColor: 'black',
          }}>
          <StatusBar hidden={true}/>
          <Video
            style={{
              width: height,
              height: width,
              backgroundColor: 'black',
            }}
            src={currentState.src}
            title={currentState.title}
            autoplay={true}
            loop={currentState.loop}
            muted={currentState.muted}
            fullscreenEnable={true}
            onFullscreen={this.onFullscreen.bind(this)}
            showControlsTimer={currentState.showControlsTimer}
            controls={true}
            seekTo={currentTime}/>
          </View>
        );
    } else {
      return <View/>;
    }
  }

  onFullscreen() {
    this.props.navigator.pop();
  }
}


export default Fullscreen;

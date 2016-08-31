import React, { Component } from 'react';
import {
  BackAndroid,
  Dimensions,
  View
} from 'react-native';

import { Video } from 'react-native-media-kit';

const {
  width,
  height
} = Dimensions.get('window');

class Fullscreen extends Component {

  render() {
    const { currentState } = this.props;

    if (currentState) {
      return (
        <Video
          style={{
            width: width,
            height: height,
          }}
          src={currentState.src}
          title={currentState.title}
          autoplay={currentState.autoplay}
          loop={currentState.loop}
          muted={currentState.muted}
          fullscreenEnable={currentState.fullscreenEnable}
          onFullscreen={this.onFullscreen.bind(this)}
          showControlsTimer={currentState.showControlsTimer}
          controls={currentState.controls}
          poster={currentState.poster}/>
        );
    } else {
      return <View/>;
    }
  }

  onFullscreen() {

  }
}


export default Fullscreen;

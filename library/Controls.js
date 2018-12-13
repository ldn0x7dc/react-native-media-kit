import React from 'react';
import { polyfill } from 'react-lifecycles-compat';

import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  NativeModules,
  requireNativeComponent,
  Dimensions,
  ScrollView,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';

import Slider from './Slider';

/**
 * format as --:-- or --:--:--
 * @param timeSec
 * @param containHours
 * @returns {string}
 */
function formatProgress(timeSec, containHours) {
  function zeroPad(s) {
    if (s.length === 1) {
      return '0' + s;
    }
    return s;
  }

  let hours = Math.floor(timeSec / 60.0 / 60.0).toFixed(0);
  let minutes = Math.floor(timeSec / 60.0 % 60.0).toFixed(0);
  let seconds = Math.floor(timeSec % 60.0).toFixed(0);

  if(hours < 0) {
    hours = 0;
  }
  if (minutes < 0) {
    minutes = 0;
  }
  if(seconds < 0) {
    seconds = 0;
  }

  hours = zeroPad(hours);
  minutes = zeroPad(minutes);
  seconds = zeroPad(seconds);

  if (containHours) {
    return hours + ':' + minutes + ':' + seconds;
  }
  return minutes + ':' + seconds;
}

class Controls extends React.Component {

  static getDerivedStateFromProps(props, state = {}) {
    if (state.sliding || state.current === props.current) {
      return null;
    }

    return {
      current: props.current,
    }
  }

  defaultProps = {
    current: 0,
    total: 0,
    buffering: false,
    playing: false
  };

  constructor(props) {
    super(props);
    this.state = {
      sliding: false,
      current: this.props.current,
    };
  }

  render() {
    const containHours = this.props.total >= 60 * 60 * 1000;
    const currentFormated = formatProgress(this.state.current / 1000, containHours);
    const totalFormated = formatProgress(this.props.total / 1000, containHours);

    let bufferIndicator;
    if(this.props.buffering) {
      bufferIndicator = (
        <ActivityIndicator
          color={'#f2f2f2'}
          size={'large'}/>
      );
    }

    let tracks = [];
    if(this.props.bufferRanges) {
      tracks = this.props.bufferRanges.map((range) => {
        let startValue = range.start;
        let endValue = startValue + range.duration;
        return {
          key: 'bufferTrack:' + startValue + '-' + endValue,
          startValue, endValue,
          style: {backgroundColor: '#eeeeee66'}
        }
      });
    }
    tracks.push(
      {
        key: 'thumbTrack',
        style: {backgroundColor: 'white'}
      }
    );


    return (
      <View
        style={{position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
        {bufferIndicator}
        <View
          style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 40, backgroundColor: '#00000033', flexDirection: 'row'}}>

          <TouchableOpacity
            onPress={this.props.onPauseOrPlay}
            style={{width: 40, height: 40, alignItems: 'center', justifyContent: 'center'}}>
            <Image
              style={{width: 20, height: 20, resizeMode: 'contain'}}
              source={this.props.playing ? require('./img/media-player-pause.png') : require('./img/media-player-play.png')}/>
          </TouchableOpacity>

          <Text
            style={{alignSelf: 'center', fontSize: 12, color: 'white', width: currentFormated.length === 5 ? 35:56, textAlign: 'right'}}>
            {currentFormated}
          </Text>

          <Slider
            style={{flex: 1, marginHorizontal: 5, height: 40}}
            trackContainerStyle={{height: 2, backgroundColor: 'gray'}}
            thumbImage={require('./img/media-player-thumb.png')}
            thumbStyle={{width: 10, height: 10}}

            onSlidingComplete={(value) => {
              this.setState({
                sliding: false,
                current: value
              });
              this.props.onSeekTo && this.props.onSeekTo(value);
            }}
            onValueChange={(value) => {
              this.setState({
                sliding: true,
                current: value
              });
            }}
            maximumValue={this.props.total}
            minimumValue={0}
            value={this.state.current}
            disabled={this.props.total < 0}
            tracks={tracks}
          />

          <Text
            style={{alignSelf: 'center', fontSize: 12, color: 'white', width: totalFormated.length === 5 ? 35:56, marginRight: 10}}>
            {totalFormated}
          </Text>
        </View>

      </View>
    );
  }
}

module.exports = polyfill(Controls);

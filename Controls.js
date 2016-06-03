import React, {PropTypes} from 'react';

import ReactNative, {
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
  ProgressBarAndroid,
  ActivityIndicatorIOS,
  Slider
} from 'react-native';

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

  hours = zeroPad(hours);
  minutes = zeroPad(minutes);
  seconds = zeroPad(seconds);

  if (containHours) {
    return hours + ':' + minutes + ':' + seconds;
  }
  return minutes + ':' + seconds;
}

const SLIDER_REF = 'sliderRef';

export default class Controls extends React.Component {

  defaultProps = {
    current: 0,
    total: 0,
    buffering: false,
    playing: false
  }

  constructor(props) {
    super(props);
    this.state = {
      sliding: false,
      current: this.props.current,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (!this.state.sliding) {
      if (this.props.current != nextProps.current) {
        this.setState({
          current: nextProps.current,
        });
      }
    }
  }

  render() {
    let containHours = this.props.total >= 60 * 60 * 1000;
    let currentFormated = formatProgress(this.state.current / 1000, containHours);
    let totalFormated = formatProgress(this.props.total / 1000, containHours);

    return (
      <View
        style={{position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
        <ActivityIndicator
          animating={this.props.buffering}
        />
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
            style={{alignSelf: 'center', fontSize: 12, color: 'white', width: currentFormated.length == 5 ? 35:56, textAlign: 'right'}}>
            {currentFormated}
          </Text>

          <Slider
            ref={SLIDER_REF}
            maximumTrackTintColor={'#a1a1a1'}
            minimumTrackTintColor={'white'}
            style={{flex: 1, marginHorizontal: 5}}
            thumbImage={require('./img/media-player-thumb.png')}

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
            value={this.state.sliding? 0 : this.state.current}
            />

          <Text
            style={{alignSelf: 'center', fontSize: 12, color: 'white', width: totalFormated.length == 5 ? 35:56, marginRight: 10}}>
            {totalFormated}
          </Text>
        </View>

      </View>
    );
  }
}

class ActivityIndicator extends React.Component {
  render() {
    if (Platform.OS === 'android') {
      if (this.props.animating) {
        return (
          <ProgressBarAndroid
            styleAttr={'Large'}
            indeterminate={true}/>
        );
      }
    } else if (Platform.OS === 'ios') {
      if (this.props.animating) {
        return (
          <ActivityIndicatorIOS
            size={'large'}
            animating={true}
          />
        );
      }
    }
    return null;
  }
}

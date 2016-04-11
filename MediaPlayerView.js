import React, {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  NativeModules,
  requireNativeComponent,
  PropTypes,
  Dimensions,
  ScrollView,
  Image,
  Platform,
  ProgressBarAndroid,
  ActivityIndicatorIOS,
  SliderIOS
} from 'react-native';

const UIManager = NativeModules.UIManager;
const RCT_MEDIA_PLAYER_VIEW_REF = "RCTMediaPlayerView";
const RCTMediaPlayerView = requireNativeComponent('RCTMediaPlayerView', {
  name: 'RCTMediaPlayerView',
  propTypes: {
    ...View.propTypes,
    uri: PropTypes.string,
    backgroundPlay: PropTypes.bool,
    autoplay: PropTypes.bool,

    onPlayerPaused: PropTypes.func,
    onPlayerPlaying: PropTypes.func,
    onPlayerFinished: PropTypes.func,
    onPlayerBuffering: PropTypes.func,
    onPlayerBufferOK: PropTypes.func,
    onPlayerProgress: PropTypes.func
  }
});

export default class MediaPlayerView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      buffering: true,
      playing: false,
      current: 0,
      total: 0,
    };
  }

  render() {
    let controlsView;
    if (this.props.controls) {
      controlsView = (
        <ControlsView
          buffering={this.state.buffering}
          playing={this.state.playing}
          current={this.state.current}
          total={this.state.total}
          onSeekTo={this.seekTo.bind(this)}
          onPauseOrPlay={() => {
            if(this.state.playing) {
              this.pause();
            } else {
              this.play();
            }
          }}
        />
      );
    }

    return (
      <View
        style={this.props.style}>

        <RCTMediaPlayerView
          {...this.props}
          style={{flex: 1, alignSelf: 'stretch'}}
          ref={RCT_MEDIA_PLAYER_VIEW_REF}
          onPlayerPlaying={this._onPlayerPlaying.bind(this)}
          onPlayerProgress={this._onPlayerProgress.bind(this)}
          onPlayerPaused={this._onPlayerPaused.bind(this)}
          onPlayerBuffering={this._onPlayerBuffering.bind(this)}
          onPlayerBufferOK={this._onPlayerBufferOK.bind(this)}
          onPlayerFinished={this._onPlayerFinished.bind(this)}
        />

        {controlsView}

      </View>
    );
  }

  pause() {
    UIManager.dispatchViewManagerCommand(
      this._getMediaPlayerViewHandle(),
      UIManager.RCTMediaPlayerView.Commands.pause,
      null
    );
  }

  play() {
    UIManager.dispatchViewManagerCommand(
      this._getMediaPlayerViewHandle(),
      UIManager.RCTMediaPlayerView.Commands.play,
      null
    );
  }

  seekTo(timeMs) {
    console.log('seekTo...' + timeMs);
    let args = [timeMs];
    UIManager.dispatchViewManagerCommand(
      this._getMediaPlayerViewHandle(),
      UIManager.RCTMediaPlayerView.Commands.seekTo,
      args
    );
  }

  _getMediaPlayerViewHandle() {
    return React.findNodeHandle(this.refs[RCT_MEDIA_PLAYER_VIEW_REF]);
  }

  _onPlayerBuffering() {
    this.props.onPlayerBuffering && this.props.onPlayerBuffering();

    if (this.props.controls) {
      this.setState({
        buffering: true
      });
    }
  }

  _onPlayerBufferOK() {
    this.props.onPlayerBufferOK && this.props.onPlayerBufferOK();

    if (this.props.controls) {
      this.setState({
        buffering: false
      });
    }
  }


  _onPlayerPlaying() {
    this.props.onPlayerPlaying && this.props.onPlayerPlaying();

    if (this.props.controls) {
      this.setState({
        buffering: false,
        playing: true
      });
    }
  }

  _onPlayerPaused() {
    this.props.onPlayerPaused && this.props.onPlayerPaused();

    if (this.props.controls) {
      this.setState({
        playing: false
      });
    }
  }

  _onPlayerFinished() {
    this.props.onPlayerFinished && this.props.onPlayerFinished();

    if (this.props.controls) {
      this.setState({
        playing: false,
        buffering: false
      });
    }
  }

  _onPlayerProgress(event) {
    let current = event.nativeEvent.current; //in ms
    let total = event.nativeEvent.total; //in ms

    //console.log('_onPlayerProgress...' + current);

    this.props.onPlayerProgress && this.props.onPlayerProgress(current, total);

    if (this.props.controls) {
      this.setState({
        current: current,
        total: total
      });
    }
  }
}

MediaPlayerView.propTypes = {
  controls: PropTypes.bool,
}
MediaPlayerView.defaultProps = {
  controls: true,
}

/**
 * format as --:-- or --:--:--
 * @param timeSec
 * @param containHours
 * @returns {string}
 */
function formatProgress(timeSec, containHours) {
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

function zeroPad(s) {
  if (s.length === 1) {
    return '0' + s;
  }
  return s;
}

class ControlsView extends React.Component {

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
            maximumTrackTintColor={'#a1a1a1'}
            minimumTrackTintColor={'white'}
            trackStyle={{height: 2, borderRadius: 1}}
            thumbStyle={{width: 10, height: 10}}
            thumbTintColor={'white'}
            style={{flex: 1, marginHorizontal: 5}}/>

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
            indeterminate={true}/>
        );
      }
    } else if (Platform.OS === 'ios') {
      return (
        <ActivityIndicatorIOS
          size={'large'}
          animating={this.props.animating}
        />
      );
    }
    return null;
  }
}

import Slider from './Slider';
//class Slider extends React.Component {
//  render() {
//    if (Platform.OS === 'android') {
//
//    } else if (Platform.OS === 'ios') {
//      return (
//        <SliderIOS
//          {...this.props}
//          thumbImage={require('./img/media-player-thumb.png')}
//        />
//      );
//    }
//
//    return null;
//  }
//}
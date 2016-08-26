// @flow

import React, {
  Component,
  PropTypes
} from 'react';
import ReactNative, {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Animated
} from 'react-native';
import Slider from '@ldn0x7dc/react-native-slider';

import reactMixin from 'react-mixin';
import TimerMixin from 'react-timer-mixin';
/*
 * Function Progress of slider
 */
function formatProgress(timeSec: number, containHours: boolean): string {
  function zeroPad(s: number): string {
    if (s.length === 1) {
      return '0' + s;
    } else if (!s) {
      return '00';
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

/*
 * ControlsView
 */
class Controls extends Component {
  static propTypes = {
    playing: PropTypes.bool,
    current: PropTypes.number,
    total: PropTypes.number,
    onSeekTo: React.PropTypes.func,
    onPauseOrPlay: React.PropTypes.func,
    bufferRanges: PropTypes.any,
    onFullscreen: React.PropTypes.func,
    fullscreen: PropTypes.bool,
    willUnmount: PropTypes.bool,
  };

  static defaultProps = {
    current: 0,
    total: 0,
    playing: false,
  };

  constructor(props: propTypes) {
    super(props);
    this.state = {
      sliding: false,
      current: this.props.current,
      animation: new Animated.Value(0),
      show: true,
    };
  }

  componentDidMount() {
    Animated.timing(this.state.animation, {
      toValue: 1,
      duration: 300,
    }).start();
  }

  componentWillReceiveProps(nextProps: propTypes) {
    if (!this.state.sliding) {
      if (this.props.current != nextProps.current) {
        this.setState({
          current: nextProps.current,
        });
      }
    }
    if (this.props.willUnmount !== nextProps.willUnmount) {
      Animated.timing(this.state.animation, {
        toValue: 0,
        duration: 300,
      }).start();
    }
  }

  render() {
    const containHours = this.props.total >= 60 * 60 * 1000;
    const currentFormated = formatProgress(this.state.current / 1000, containHours);
    const totalFormated = formatProgress(this.props.total / 1000, containHours);

    let tracks = [];
    if (this.props.bufferRanges) {
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
        style: {backgroundColor: 'rgb(49, 173, 221)'}
      }
    );

    const animationStyle = {
      opacity: this.state.animation,
      transform: [{
        translateY: this.state.animation.interpolate({
          inputRange: [0, 0.1, 1],
          outputRange: [30, 7, 0]
        })
      }],
    }

    return (
      <View
        style={styles.controls}>
        <Animated.View
          style={[styles.controlsActions, animationStyle]}>
          <TouchableOpacity
            onPress={() => {
              if (this.state.show) {
                this.props.onPauseOrPlay();
              }}
            }
            style={styles.buttonContainer}>
            <Image
              style={styles.buttonImg}
              source={this.props.playing ? require('./img/media-player-pause.png') : require('./img/media-player-play.png')}/>
          </TouchableOpacity>
          <Text
            style={[styles.currentTime, { width: currentFormated.length == 5 ? 35:56 }]}>
            {currentFormated}
          </Text>
          <Slider
            style={styles.slider}
            trackContainerStyle={{ height: 2, backgroundColor: 'gray' }}
            thumbImage={require('./img/media-player-thumb.png')}
            thumbStyle={{width:10, height: 10}}
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
            disable={this.props.total <= 0}
            tracks={tracks}
          />
          <Text
            style={[styles.totalTime, { width: totalFormated.length == 5 ? 35:56 }]}>
            {totalFormated}
          </Text>
          <TouchableOpacity
            onPress={() => this.state.show && this.props.onFullscreen()}
            style={styles.buttonContainer}>
            <Image
              style={[styles.buttonImg, {height: 15, width: 15}]}
              source={this.props.fullscreen ? require('./img/media-player-fullscreen-off.png') : require('./img/media-player-fullscreen-on.png')}/>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }
}

reactMixin.onClass(Controls, TimerMixin);

const styles = StyleSheet.create({
  controls: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsActions: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 40,
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: 'transparent',
  },
  buttonContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonImg: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  currentTime: {
    alignSelf: 'center',
    fontSize: 10,
    color: 'white',
    textAlign: 'right',
    overflow: 'visible',
  },
  totalTime: {
    alignSelf: 'center',
    fontSize: 10,
    color: 'white',
  },
  slider: {
    flex: 1,
    marginHorizontal: 5,
    height: 40,
  },
});

export default Controls;

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
    playing: PropTypes.bool.isRequired,
    current: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
    onSeekTo: React.PropTypes.func.isRequired,
    onPauseOrPlay: React.PropTypes.func.isRequired,
    bufferRanges: PropTypes.any,
    onFullscreen: React.PropTypes.func.isRequired,
    fullscreen: PropTypes.bool.isRequired,
    willUnmount: PropTypes.bool.isRequired,
    title: PropTypes.string, // if null, does not display name
    leaveTimer: PropTypes.func,
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
    this.updateTimer = this.updateTimer.bind(this);
  }

  componentDidMount() {
    Animated.timing(this.state.animation, {
      toValue: 1,
      duration: 300,
    }).start();
    this.setTimeout(() => {
      this.props.leaveTimer('less');
    }, 2500);
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
          outputRange: [30, 7, 0],
        })
      }],
    };

    let titleShow;
    if (this.props.title) {
      const animationTitleStyle = {
        opacity: this.state.animation,
        transform: [{
          translateY: this.state.animation.interpolate({
            inputRange: [0, 0.1, 1],
            outputRange: [-30, -7, 0],
          })
        }],
      };
      titleShow = (
        <Animated.View style={[animationTitleStyle, styles.titleContainer]}>
          <Text style={styles.title}>{this.props.title}</Text>
        </Animated.View>
      );
    }

    return (
      <View
        style={styles.controls}>
        {titleShow}
        <Animated.View
          style={[styles.controlsActions, animationStyle]}>
          <TouchableOpacity
            onPress={() => {
              if (this.state.show) {
                this.props.onPauseOrPlay();
                this.updateTimer();
              }}
            }
            style={styles.buttonContainer}>
            <Image
              style={styles.buttonImg}
              source={this.props.playing ? require('./img/ic-pause-48.png') : require('./img/ic-play-48.png')}/>
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
              this.updateTimer();
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
            onPress={() => {
              if (this.state.show) {
                this.props.onFullscreen();
                this.updateTimer();
              }
            }}
            style={styles.buttonContainer}>
            <Image
              style={[styles.buttonImg, {height: 20, width: 20}]}
              source={this.props.fullscreen ? require('./img/ic-collapse-48.png') : require('./img/ic-expand-48.png')}/>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  updateTimer() {
    this.props.leaveTimer('more');
    this.setTimeout(() => {
      this.props.leaveTimer('less');
    }, 2500);
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
    alignItems: 'flex-start',
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  titleContainer: {
    padding: 10,
    paddingLeft: 15,
    height: 35,
    flexDirection: 'row',
    alignSelf: 'stretch',
    alignItems: 'flex-start',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  controlsActions: {
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
    width: 23,
    height: 23,
    resizeMode: 'contain',
  },
  title: {
    alignSelf: 'center',
    fontSize: 16,
    color: 'white',
    overflow: 'visible',
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

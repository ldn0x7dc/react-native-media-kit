// @flow
import React, {
  Component,
  PropTypes
} from 'react';

import ReactNative, {
  StyleSheet,
  View,
  NativeModules,
  requireNativeComponent,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native';

import Controls from './Controls';
import reactMixin from 'react-mixin';
import TimerMixin from 'react-timer-mixin';


const UIManager = NativeModules.UIManager;
const RCT_MEDIA_PLAYER_VIEW_REF = "RCTMediaPlayerView";
const RCTMediaPlayerView = requireNativeComponent('RCTMediaPlayerView', {
  name: 'RCTMediaPlayerView',
  propTypes: {
    ...View.propTypes,
    src: PropTypes.string,
    autoplay: PropTypes.bool,
    preload: PropTypes.string,
    loop: PropTypes.bool,
    muted: PropTypes.bool,

    onPlayerPaused: PropTypes.func,
    onPlayerPlaying: PropTypes.func,
    onPlayerFinished: PropTypes.func,
    onPlayerBuffering: PropTypes.func,
    onPlayerBufferOK: PropTypes.func,
    onPlayerProgress: PropTypes.func,
    onPlayerBufferChange: PropTypes.func,
  }
});

class MediaPlayerView extends Component {

  static propTypes = {
    ...RCTMediaPlayerView.propTypes,
    controls: PropTypes.bool,
    poster: PropTypes.string,
    title: PropTypes.string,
    onFullscreen: PropTypes.func,
    fullscreenEnable: PropTypes.bool,
    showControlsTimer: PropTypes.number,
    seekTo: PropTypes.number,
  };

  static defaultProps = {
    autoplay: false,
    controls: true,
    title: null, // show title only if it exist
    preload: 'none',
    loop: false,
    fullscreenEnable: true,
    showControlsTimer: 2500,
  };

  constructor(props: propTypes) {
    super(props);
    this.state = {
      buffering: false,
      playing: false,
      current: 0,
      total: 0,
      controlsWillUnmount: false,
      width: 0,
      height: 0,
      showPoster: true,
      controls: props.controls,
      fullscreen: false,
      stateControls: 0,
    };
    if (props.poster && this.state.showPoster) {
      this.state = {...this.state, controls: false};
    }
    this.seekTo = this.seekTo.bind(this);
    this.onFullscreen = this.onFullscreen.bind(this);

    /*
     * SeekTo props
     */
    if (props.seeekTo) {
      this.state = {...this.state, showPoster: false};
      let args = [props.seekTo];
      UIManager.dispatchViewManagerCommand(
        this._getMediaPlayerViewHandle(),
        UIManager.RCTMediaPlayerView.Commands.seekTo,
        args
      );
      UIManager.dispatchViewManagerCommand(
        this._getMediaPlayerViewHandle(),
        UIManager.RCTMediaPlayerView.Commands.play,
        null
      );
    }
  }

  componentWillUnmount() {
    this.stop();
  }

  componentWillReceiveProps(nextProps: propTypes) {
    if (this.props.controls != nextProps.controls) {
      if (nextProps.controls) {
        this.onPress(1);
      } else {
        this.setState({controlsWillUnmount: true});
        this.setTimeout(() => {
          this.setState({
            controls: false,
            controlsWillUnmount: false,
            stateControls: 0,
          });
        }, 350);
      }
    }
  }

  render() {
    /*
     * Poster (Image when mediaPlayer is not started)
     */
    let posterView;
    if(this.props.poster && this.state.width && this.state.height && this.state.showPoster) {
      posterView = (
        <TouchableOpacity
          onPress={this.onPosterPress.bind(this)}
          style={[styles.posterTouch, { width: this.state.width, height: this.state.height }]}>
          <Image
            style={styles.posterImg}
            source={{uri: this.props.poster}}/>
          </TouchableOpacity>
      );
    }

    /*
     * Controls (=> play/pause button, slider, expand/collapse button)
     */
    let controlsView;
    if (this.state.controls) {
      controlsView = (
        <Controls
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
          bufferRanges={this.state.bufferRanges}
          onFullscreen={this.onFullscreen}
          fullscreen={this.state.fullscreen}
          willUnmount={this.state.controlsWillUnmount}
          title={this.props.title}
          leaveTimer={this.leaveTimer.bind(this)}
          fullscreenEnable={this.props.fullscreenEnable}
          showControlsTimer={this.props.showControlsTimer}
        />
      );
    }

    /*
     * Spinning overlay
     */
    let bufferIndicator;
    if (this.state.buffering) {
      bufferIndicator = (
        <ActivityIndicator
          color={'#f2f2f2'}
          size={'large'}
          style={styles.positionAbsolute}/>
      );
    }

    return (
      <TouchableWithoutFeedback style={this.props.style}
        onLayout={this._onLayout.bind(this)}
        onPress={this.onPress.bind(this)}>
        <View style={this.props.style}>
          <RCTMediaPlayerView
            {...this.props}
            style={styles.mediaPlayerStyle}
            ref={RCT_MEDIA_PLAYER_VIEW_REF}
            onPlayerPlaying={this._onPlayerPlaying.bind(this)}
            onPlayerProgress={this._onPlayerProgress.bind(this)}
            onPlayerPaused={this._onPlayerPaused.bind(this)}
            onPlayerBuffering={this._onPlayerBuffering.bind(this)}
            onPlayerBufferOK={this._onPlayerBufferOK.bind(this)}
            onPlayerFinished={this._onPlayerFinished.bind(this)}
            onPlayerBufferChange={this._onPlayerBufferChange.bind(this)}
          />
          {bufferIndicator}
          {posterView}
          {controlsView}
        </View>
      </TouchableWithoutFeedback>
    );
  }

  leaveTimer(action: string) {
    if (action === 'more') {
      this.setState({stateControls: this.state.stateControls + 1});
    } else if (action === 'less') {
      this.setState({stateControls: this.state.stateControls - 1});
    }
    if (this.state.stateControls == -1 && !this.state.controlsWillUnmount) {
      this.onPress();
      this.setState({stateControls: 0});
    }
  }

  /*
   * Appear and disappear of controls
   */
  onPress(action = 0: number) {
    /*
     * action is defined by 1 if you want to force over props the function
     */
    if (this.props.controls || action === 1) {
      if (!this.state.controlsWillUnmount) {
        if (!this.state.controls) {
          this.setState({
            controls: true,
            controlsWillUnmount: false,
          })
        } else {
          this.setState({controlsWillUnmount: true});
          this.setTimeout(() => {
            this.setState({
              controls: false,
              controlsWillUnmount: false,
              stateControls: 0,
            });
          }, 350);
        }
      }
    }
  }

  _onLayout(e) {
    const {width, height} = e.nativeEvent.layout;
    this.setState({width, height});

    this.props.onLayout && this.props.onLayout(e);
  }

  onPosterPress() {
    this.setState({controls:true});
    this.play();
  }

  onFullscreen(value) {
    if (this.props.onFullscreen) {
      this.props.onFullscreen(this.state.fullscreen, value);
    }
    this.setState({fullscreen: !this.state.fullscreen})
    return true;
  }

  pause() {
    UIManager.dispatchViewManagerCommand(
      this._getMediaPlayerViewHandle(),
      UIManager.RCTMediaPlayerView.Commands.pause,
      null
    );
  }

  play() {
    this.setState({showPoster: false})
    UIManager.dispatchViewManagerCommand(
      this._getMediaPlayerViewHandle(),
      UIManager.RCTMediaPlayerView.Commands.play,
      null
    );
  }

  stop() {
    UIManager.dispatchViewManagerCommand(
      this._getMediaPlayerViewHandle(),
      UIManager.RCTMediaPlayerView.Commands.stop,
      null
    );
  }

  seekTo(timeMs) {
    this.setState({showPoster: false})
    let args = [timeMs];
    UIManager.dispatchViewManagerCommand(
      this._getMediaPlayerViewHandle(),
      UIManager.RCTMediaPlayerView.Commands.seekTo,
      args
    );
  }

  _getMediaPlayerViewHandle() {
    return ReactNative.findNodeHandle(this.refs[RCT_MEDIA_PLAYER_VIEW_REF]);
  }

  _onPlayerBuffering() {
    this.props.onPlayerBuffering && this.props.onPlayerBuffering();

    if (this.props.controls) {
      this.setState({
        buffering: true
      });
    }
  }

  _onPlayerBufferChange(e) {
    this.props.onPlayerBuffering && this.props.onPlayerBuffering(e);

    if (this.props.controls) {
      this.setState({
        bufferRanges: e.nativeEvent.ranges
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
        buffering: false,
        showPoster: true,
        controls: false,
      });
    }
  }

  _onPlayerProgress(event) {
    let current = event.nativeEvent.current; //in ms
    let total = event.nativeEvent.total; //in ms

    this.props.onPlayerProgress && this.props.onPlayerProgress(current, total);

    if (this.props.controls) {
      this.setState({
        current: current,
        total: total
      });
    }
  }
}

reactMixin.onClass(MediaPlayerView, TimerMixin);

const styles = StyleSheet.create({
  positionAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  posterTouch: {
    position: 'absolute',
    left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: 'transparent',
  },
  posterImg: {
    flex: 1,
    resizeMode: 'contain',
    backgroundColor: 'black',
  },
  mediaPlayerStyle: {
    flex: 1,
    alignSelf: 'stretch',
  },
});

export default MediaPlayerView;

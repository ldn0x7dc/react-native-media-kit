import React, {PropTypes} from 'react';

import ReactNative, {
  StyleSheet,
  View,
  NativeModules,
  requireNativeComponent,
  Image
} from 'react-native';

import Controls from './Controls';

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
    onPlayerBufferChange: PropTypes.func
  }
});

export default class MediaPlayerView extends React.Component {

  static propTypes = {
    ...RCTMediaPlayerView.propTypes,
    controls: PropTypes.bool,
    poster: PropTypes.string
  }

  static defaultProps = {
    autoplay: false,
    controls: true,
    preload: 'none',
    loop: false,
  }

  constructor(props) {
    super(props);
    this.state = {
      buffering: false,
      playing: false,
      current: 0,
      total: 0,

      width: 0,
      height: 0,
      showPoster: true

    };
  }

  componentWillUnmount() {
    console.log('componentWillUnmount...');
    this.stop();
  }

  render() {
    let posterView;
    if(this.props.poster && this.state.width && this.state.height && this.state.showPoster) {
      posterView = (
        <Image
          style={{
          position: 'absolute',
          left: 0, right: 0, top: 0, bottom: 0,
          backgroundColor: 'transparent',
          width: this.state.width,
          height: this.state.height,
          resizeMode: 'contain'
          }}
          source={{uri: this.props.poster}}/>
      );
    }

    let controlsView;
    if (this.props.controls) {
      controlsView = (
        <Controls
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
        style={this.props.style}
        onLayout={this._onLayout.bind(this)}>

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
          onPlayerBufferChange={(e) => {
            //console.log('onPlayerBufferChange...' + JSON.stringify(e.nativeEvent));
          }}
        />

        {posterView}
        {controlsView}
      </View>
    );
  }

  _onLayout(e) {
    const {width, height} = e.nativeEvent.layout;
    this.setState({width, height});

    this.props.onLayout && this.props.onLayout(e);
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

    this.props.onPlayerProgress && this.props.onPlayerProgress(current, total);

    if (this.props.controls) {
      this.setState({
        current: current,
        total: total
      });
    }
  }
}
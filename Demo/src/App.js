import React, {
  Component,
  PropTypes
} from 'react';
import {
  View,
  Dimensions,
  ScrollView,
  StyleSheet,
  Navigator
} from 'react-native';
import CustomSwitch from './Switch';
import CustomSlider from './Slider';
import CustomTextInput from './TextInput';
import Button from './Button';
import reactMixin from 'react-mixin';
import TimerMixin from 'react-timer-mixin';

import { Video } from 'react-native-media-kit';

const {
  width,
  height
} = Dimensions.get('window');

const HTTP = [
  'http://v.yoai.com/femme_tampon_tutorial.mp4'
];

const HLS = [
  'https://devimages.apple.com.edgekey.net/streaming/examples/bipbop_4x3/bipbop_4x3_variant.m3u8',
  'http://cdn3.viblast.com/streams/hls/airshow/playlist.m3u8',
  'http://sample.vodobox.net/skate_phantom_flex_4k/skate_phantom_flex_4k.m3u8',
  'http://content.jwplatform.com/manifests/vM7nH0Kl.m3u8',
  'http://vevoplaylist-live.hls.adaptive.level3.net/vevo/ch3/appleman.m3u8',
  'http://playertest.longtailvideo.com/adaptive/captions/playlist.m3u8',
  'http://playertest.longtailvideo.com/adaptive/oceans_aes/oceans_aes.m3u8'
];

const POSTER = [
  'http://vignette2.wikia.nocookie.net/tovid/images/7/7b/16_9_grid.jpg/revision/latest?cb=20060423235229',
  // large image vvvvvv
  'http://wallpapers-and-backgrounds.net/wp-content/uploads/2016/01/skate-full-hd-background_1_1600x900.jpg'
];

const initalState = {
  width: width,
  height: width / (16/9),
  controls: true,
  autoplay: false,
  loop: true,
  muted: false,
  fullscreenEnable: true,
  title: 'Hello World !',
  src: HLS[2],
  poster: POSTER[0],
  showPoster: true,
  showControlsTimer: 2500,
  reload: false,
};

class App extends Component {

  static propTypes = {
    navigator: PropTypes.any,
  };

  constructor() {
    super();
    this.state = initalState;
  }

  render() {

    let VideoComponent;
    if (!this.state.reload) {
      VideoComponent = (
        <Video
          style={[{
            width: this.state.width,
            height: this.state.height,
          }, styles.videoContainer]}
          src={this.state.src}
          title={this.state.title}
          autoplay={this.state.autoplay}
          loop={this.state.loop}
          muted={this.state.muted}
          fullscreenEnable={this.state.fullscreenEnable}
          onFullscreen={this.onFullscreen.bind(this)}
          showControlsTimer={this.state.showControlsTimer}
          controls={this.state.controls}
          poster={this.state.poster}/>
        );
    } else {
      VideoComponent = false;
    }


    return (
      <View style={styles.container}>
      <Button
        label="Reload MediaPlayer"
        style={{margin: 10}}
        onPress={this.reloadMedia.bind(this)}/>
        {VideoComponent}
        <ScrollView
          style={styles.scrollViewContainer}>
          <CustomSwitch
            label="Show Controls"
            onValueChange={this.isControls.bind(this)}
            value={this.state.controls}/>
          <CustomSlider
            label="Controls Timer"
            style={{backgroundColor: 'rgba(172, 165, 142, 0.17)'}}
            value={this.state.showControlsTimer}
            onSlidingComplete={this.onShowControlsTimer.bind(this)}
            minimumValue={1000}
            maximumValue={10000}
            step={100}
            disabled={!this.state.controls}/>
          <CustomSwitch
            label="Muted"
            onValueChange={this.isMuted.bind(this)}
            value={this.state.muted}/>
          <CustomSwitch
            label="Fullscreen Enable"
            onValueChange={this.isFullscreenEnable.bind(this)}
            value={this.state.fullscreenEnable}
            style={{backgroundColor: 'rgba(172, 165, 142, 0.17)'}}
            disabled={!this.state.controls}/>
          <CustomSwitch
            label="Autoplay"
            onValueChange={this.isAutoplay.bind(this)}
            value={this.state.autoplay}/>
          <CustomSwitch
            label="Loop"
            onValueChange={this.isLoop.bind(this)}
            value={this.state.loop}
            style={{backgroundColor: 'rgba(172, 165, 142, 0.17)'}}/>
          <CustomSwitch
            label="Show Poster"
            onValueChange={this.isPoster.bind(this)}
            value={this.state.showPoster}/>
          <CustomTextInput
            label="Title"
            placeholder="Leave empty if you don't want a title"
            style={{backgroundColor: 'rgba(172, 165, 142, 0.17)'}}
            text={this.state.title}
            onSubmitEditing={this.onTitle.bind(this)}
            editable={this.state.controls}/>
          <Button
            label="Reset Settings"
            onPress={this.resetSettings.bind(this)}/>
        </ScrollView>
      </View>
    );
  }

  onFullscreen(fullscreenState, currentTime) {
    this.props.navigator.push({
      index: 1,
      currentState: this.state,
    });
  }

  reloadMedia() {
    this.setState({reload: true});
    this.setTimeout(() => {
      this.setState({reload: false});
    }, 500);
  }

  isPoster() {
    this.setState({
      poster: (this.state.poster ? '' : initalState.poster),
      showPoster: !this.state.showPoster,
    });
  }

  isAutoplay() {
    this.setState({autoplay: !this.state.autoplay});
  }

  isLoop() {
    this.setState({loop: !this.state.loop});
  }

  isMuted() {
    this.setState({muted: !this.state.muted});
  }

  isFullscreenEnable() {
    this.setState({fullscreenEnable: !this.state.fullscreenEnable});
  }

  isControls() {
    this.setState({controls: !this.state.controls});
  }

  onShowControlsTimer(value) {
    console.debug(value);
    this.setState({showControlsTimer: value});
  }

  onTitle(event) {
    this.setState({title: event.nativeEvent.text});
  }

  resetSettings() {
    this.setState(initalState);
  }
}

reactMixin.onClass(App, TimerMixin);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(169, 213, 61, 0.42)',
  },
  videoContainer: {
    backgroundColor: 'black',
  },
  scrollViewContainer: {
    flex: 1,
    backgroundColor: 'rgba(169, 213, 61, 0.42)',
  },
});

export default App;

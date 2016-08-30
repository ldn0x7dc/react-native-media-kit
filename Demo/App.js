'use strict';

import React, { Component } from 'react';
import {
  Text,
  View,
  Dimensions,
  ScrollView,
  TouchableOpacity
} from 'react-native';

const {width, height} = Dimensions.get('window');

import {Video} from 'react-native-media-kit';

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


export default class App extends Component {

  state = {
    muted: false,
    width: width,
    height: width / (16/9),
    controls: true
  };

  render() {
    return (
      <View style={{flex: 1, paddingTop: 50}}>
        <Video
          style={{width: this.state.width, height: this.state.height, backgroundColor: 'black'}}
          autoplay={false}
          preload='none'
          loop={false}
          controls={this.state.controls}
          muted={true}
          src={HLS[2]}
          title="hello"
          poster="http://www.w3schools.com/css/trolltunga.jpg"
        />
      </View>
    );
  }
}

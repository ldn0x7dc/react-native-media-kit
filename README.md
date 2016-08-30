# react-native-media-kit

Video(and audio) component for react-native apps, supporting both iOS and Android, with API similar to HTML video.

A default set of controls is provided to play/pause, seek and to display current playback and buffer progress.

Runs on react-native 0.28+ (The limit exists due to [ActivityIndicator](https://facebook.github.io/react-native/docs/activityindicator.html) comes after 0.28).

Supported media types:

* iOS: Should be same as those supported by [AVPlayer](https://developer.apple.com/library/ios/documentation/AVFoundation/Reference/AVPlayer_Class/)


* Android: Shold be same as those supported by [ExoPlayer](https://github.com/google/ExoPlayer)

![](Demo/demo.gif).

## Install

`npm install --save react-native-media-kit@latest `

#### iOS

For now, just drag ***react-native-media-kit.xcodeproj*** into your Xcode project and link the **libreact-native-media-kit.a** library.

#### Android

**android/settings.gradle**

```
include ':react-native-media-kit'
project(':react-native-media-kit').projectDir = new File('../node_modules/react-native-media-kit/android')
```

**android/app/build.gradle**

```
dependencies {
    ...
    compile project(':react-native-media-kit')
}
```

**MainActivity.java (or MainApplication on rn 0.29+)**

```
import com.greatdroid.reactnative.media.MediaKitPackage;
...
protected List<ReactPackage> getPackages() {
    return Arrays.<ReactPackage>asList(
        new MainReactPackage(),
            new MediaKitPackage()
    );
}
```



## Documentation

### API

The API is designed to mimics html [`<video />`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video). (*For now, the Video and Audio component are identical*)

###### But

[Liroo](https://github.com/Liroo) added some custom/js props which is not relative to html.

See #26 for further information about this PR.

##### Properties

| key                  | value                                    | type | default |
| -------------------- | ---------------------------------------- | ---- | ------- |
| src                  | the URL of the video                     | string (url) | *null* |
| autoplay             | true to automatically begins to play. | bool | `false` |
| preload              | can be 'none', 'auto'. | string | `'none'` |
| loop                 | true to automatically seek back to the start upon reaching the end of the video. | bool | `false` |
| muted                | true to silence the audio. | bool | `false` |
| controls             | true to show controls to allow user to control video playback, including seeking, and pause/resume playback. | bool | `true` |
| poster               | an image URL indicating a poster frame to show until the user plays. | string (url) | *null* |
| title | If controls is `true` and title is defined, title will be display on the video | string | *null* |
| fullscreenEnable | Add a fullscreen button controls (You must create your own view in full screen. Disable if you do not want) | bool | `true` |
| onFullScreen | Callback called when fullscreen button is pressed | func (fullscreenState: bool, currentTime: number) | *undefined* |
| showControlsTimer | in ms, the time of appearance of controls | number | 2500 (2.5s) |
| seekTo | a special parameter that will start the video at the given value (normally used to manage the view in full screen) | number | 0 |

##### Exemple

```
/*
 * Demo/App.js
 */

import {Video} from 'react-native-media-kit';
...
render() {
  return (
  	<Video
      style={{width: width, height: width / (16/9)}}
      src={'http://v.yoai.com/femme_tampon_tutorial.mp4'}
      autoplay={false}
      preload={'none'}
      loop={false}
      controls={true}
      muted={false}
      poster={'http://static.yoaicdn.com/shoppc/images/cover_img_e1e9e6b.jpg'}
    />
  );
}

```

For details about the usage of above APIs, check `library/MediaPlayerView.js`.


## TODO

* background play
* Hit on slider (PR on the original dependency)

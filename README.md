# react-native-media-kit

Video(and audio) component for react-native apps, supporting both iOS and Android. An unified and elegant player controller is provided by default. The API is similar with HTML video.

Runs on react-native 0.28+. Supported media types:

* iOS: Should be same as those supported by [MPMoviePlayerController](https://developer.apple.com/library/ios/documentation/MediaPlayer/Reference/MPMoviePlayerController_Class/)


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

**MainActivity.java**

```
import com.yoai.reactnative.media.MediaKitPackage;
...
protected List<ReactPackage> getPackages() {
    return Arrays.<ReactPackage>asList(
        new MainReactPackage(),
            new MediaKitPackage()
    );
}
```



## Documentation

Quite same as the the HTML <Video />:

```
import {Video} from 'react-native-media-kit';
...
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
```

### API

The API is designed to mimics html [`<video />`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video).  

For now, the Video and Audio component are identical.

##### Properties

| key                  | value                                    | iOS  | Android |
| -------------------- | ---------------------------------------- | ---- | ------- |
| src                  | the URL of the video                     | OK   | OK      |
| autoplay             | true to automatically begins to play. Default is false. | OK   | OK      |
| preload              | can be 'none', 'auto'. Default is 'none'. | OK   | OK      |
| loop                 | true to automatically seek back to the start upon reaching the end of the video. Default is 'false'. | OK   | OK      |
| controls             | true to show controls to allow user to control video playback, including seeking, and pause/resume playback. Default is true. | OK   | OK      |
| poster               | an image URL indicating a poster frame to show until the user plays. | OK   | OK      |
| muted                | true to silence the audio. Default is false. | OK   | OK      |
| onPlayerPaused       |                                          | OK   | OK      |
| onPlayerPlaying      |                                          | OK   | OK      |
| onPlayerFinished     |                                          | OK   | OK      |
| onPlayerBuffering    |                                          | OK   | OK      |
| onPlayerBufferOK     |                                          | OK   | OK      |
| onPlayerProgress     |                                          | OK   | OK      |
| onPlayerBufferChange | Working on it to support Android         | OK   | N.A     |

You can use the onPlayerXXX callbacks  to implement  your custom controls.

##### Methods

- ***pause***
- ***play***
- ***stop***
- ***seekTo***




## TODO

* toggle between normal size and fullscreen
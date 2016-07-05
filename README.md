# react-native-media-kit

Video and Audio component for react-native apps, supporting both iOS and Android. 

Runs on react-native 0.28+. Supported media types:

* iOS: Should be same as those supported by [MPMoviePlayerController](https://developer.apple.com/library/ios/documentation/MediaPlayer/Reference/MPMoviePlayerController_Class/)


* Android: Shold be same as those supported by [ExoPlayer](https://github.com/google/ExoPlayer)

![](Demo/demo.gif).

## Install

`npm install —-save react-native-media-kit@latest `

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
  poster={'http://static.yoaicdn.com/shoppc/images/cover_img_e1e9e6b.jpg'}
/>
```

### API

The API is designed to mimics [html <Video />](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video).  For now, the Video and Audio component are identical.

##### Properties

| key          | value                                    | iOS  | Android |
| ------------ | ---------------------------------------- | ---- | ------- |
| **src**      | The URL of the video                     | OK   | OK      |
| **autoplay** | A Boolean attribute; if specified, the video automatically begins to play back as soon as it's ready | OK   | OK      |
| **preload**  | A String attribute: can be 'none', 'metadata'(iOS only), 'auto' | OK   | OK      |
| **loop**     | A Boolean attribute; if specified, we will, upon reaching the end of the video, automatically seek back to the start. | OK   | OK      |
| **controls** | A Boolean attribute; if specifid, will offer controls to allow the user to control video playback, including seeking, and pause/resume playback. | OK   | OK      |
| poster       | A URL indicating a poster frame to show until the user plays. | OK   | OK      |

##### Callbacks

| key                   |                  | iOS  | Android |
| --------------------- | :--------------: | ---- | ------- |
| **onPlayerPaused**    | As the same says | OK   | OK      |
| **onPlayerPlaying**   |                  | OK   | OK      |
| **onPlayerFinished**  |                  | OK   | OK      |
| **onPlayerBuffering** |                  | OK   | OK      |
| **onPlayerBufferOK**  |                  | OK   | OK      |
| **onPlayerProgress**  |                  | OK   | OK      |

##### Methods

- pause
- play
- stop
- seekTo




## TODO

* mute feature(Not possilble for MPMoviePlayerController)
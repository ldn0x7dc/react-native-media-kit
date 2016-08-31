import React, { Component } from 'react';
import {
  View,
  Navigator,
  BackAndroid
} from 'react-native';

import App from './App';
import Fullscreen from './Fullscreen';

class AppNavigator extends Component {

  render() {
    let navigator;

    BackAndroid.addEventListener('hardwareBackPress', () => {
      if (navigator && navigator.getCurrentRoutes().length > 1) {
        navigator.pop();
        return true;
      }
      return false;
    });

    const routes = [
      {title: 'fullscreenOff', index: 0},
      {title: 'fullscreenOn', index: 1},
    ];

    return (
      <Navigator
        ref={(ref) => navigator = ref}
        configureScene={ this.configureScene }
        initialRoute={routes[0]}
        initialRouteStack={routes}
        renderScene={this.renderScene}>
      </Navigator>
    );
  }

  configureScene() {
    return Navigator.SceneConfigs.FadeAndroid;
  }

  renderScene(route, navigator) {
    if (route.index === 0) {
      return (<App navigator={navigator}/>);
    } else if (route.index === 1) {
      return (<Fullscreen navigator={navigator} currentState={route.currentState} currentTime={route.currentTime}/>);
    }
  }
}

export default AppNavigator;

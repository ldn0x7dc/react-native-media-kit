import React, { Component } from 'react';
import {
  AppRegistry
} from 'react-native';

import AppNavigator from './src/Navigator';

class Demo extends Component {
  render() {
    return (
      <AppNavigator />
    );
  }
}

AppRegistry.registerComponent('Demo', () => Demo);

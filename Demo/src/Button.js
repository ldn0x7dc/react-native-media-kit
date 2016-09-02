import React, {
  Component,
  PropTypes
} from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions
} from 'react-native';

class Button extends Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    onPress: PropTypes.func.isRequired,
    style: View.propTypes.style,
    styleText: Text.propTypes.style
  };

  render() {
    const { label, onPress, style, styleText } = this.props;
    return (
      <View style={[style, styles.container]}>
        <TouchableOpacity
          style={[style, styles.touchable]}
          onPress={onPress}>
          <Text
            style={[styleText, styles.label]}>
            {label}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const {
  width
} = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'black',
    shadowRadius: 3,
  },
  label: {
    fontSize: 16,
    color: 'white',
  },
  touchable: {
    height: 60,
    width: width - 60,
    backgroundColor: 'rgba(74, 74, 74, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Button;

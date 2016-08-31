import React, {
  Component,
  PropTypes
} from 'react';
import {
  View,
  Switch,
  Text,
  StyleSheet
} from 'react-native';

class CustomSwitch extends Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    onValueChange: PropTypes.func.isRequired,
    value: PropTypes.bool.isRequired,
    style: View.propTypes.style,
    styleText: Text.propTypes.style,
    disabled: PropTypes.bool,
  };

  static defaultProps = {
    disabled: false,
  };

  render() {
    const { label, onValueChange, value, style, styleText, disabled } = this.props;
    return (
      <View
        style={[style, styles.container]}>
        <Text
          style={[styleText, styles.label]}>
          {label}
        </Text>
        <Switch
          style={styles.switch}
          onValueChange={onValueChange}
          value={value}
          disabled={disabled}/>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 50,
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: 'black',
    shadowRadius: 3,
  },
  label: {
    fontSize: 16,
    color: 'black',
    marginLeft: 40,
  },
  switch: {
    marginRight: 40,
  },
});

export default CustomSwitch;

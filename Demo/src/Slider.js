import React, {
  Component,
  PropTypes
} from 'react';
import {
  View,
  Slider,
  Text,
  StyleSheet,
  Dimensions
} from 'react-native';

class CustomSlider extends Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    onSlidingComplete: PropTypes.func.isRequired,
    value: PropTypes.number.isRequired,
    minimumValue: PropTypes.number.isRequired,
    maximumValue: PropTypes.number.isRequired,
    style: View.propTypes.style,
    styleText: Text.propTypes.style,
    disabled: PropTypes.bool,
    step: PropTypes.number.isRequired,
  };

  static defaultProps = {
    disabled: false,
  };

  constructor(props: propTypes) {
    super(props);
    this.state = {
      currentValue: props.value,
    }
  }

  componentWillReceiveProps(nextProps: propTypes) {
    this.setState({currentValue: nextProps.value})
  }

  render() {
    const { label, maximumValue, minimumValue, step, onSlidingComplete, style, styleText, disabled } = this.props;
    const currentValue = this.state.currentValue / 1000;
    return (
      <View
        style={[style, styles.container]}>
        <Text
          style={[styleText, styles.label]}>
          {label}
        </Text>
        <Text>{currentValue} s</Text>
        <Slider
          style={styles.slider}
          disabled={disabled}
          maximumValue={maximumValue}
          minimumValue={minimumValue}
          onSlidingComplete={onSlidingComplete}
          onValueChange={this.onValueChange.bind(this)}
          value={this.state.currentValue}
          step={step}
          />
      </View>
    );
  }

  onValueChange(value) {
    this.setState({currentValue: value})
  }
}
const {
  width
} = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'black',
    shadowRadius: 3,
  },
  label: {
    fontSize: 16,
    color: 'black',
  },
  slider: {
    width: width - 80,
  },
});

export default CustomSlider;

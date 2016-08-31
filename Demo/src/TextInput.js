import React, {
  Component,
  PropTypes
} from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet
} from 'react-native';

class CustomTextInput extends Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    placeholder: PropTypes.string.isRequired,
    style: View.propTypes.style,
    styleText: Text.propTypes.style,
    editable: PropTypes.bool,
    text: PropTypes.string,
  };

  static defaultProps = {
    editable: true,
  };

  constructor(props: propTypes) {
    super(props);
    this.state = {
      currentText: props.text,
    }
  }

  componentWillReceiveProps(nextProps: propTypes) {
    this.setState({currentText: nextProps.text})
  }

  render() {
    const { label, style, onSubmitEditing, styleText, placeholder, editable } = this.props;
    return (
      <View
        style={[style, styles.container]}>
        <Text
          style={[styleText, styles.label]}>
          {label}
        </Text>
        <TextInput
          style={styles.textinput}
          placeHolder={placeholder}
          editable={editable}
          onChangeText={this.onChangeText.bind(this)}
          onSubmitEditing={onSubmitEditing}
          value={this.state.currentText}/>
      </View>
    );
  }

  onChangeText(e) {
    this.setState({currentText: e});
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
  textinput: {
    marginRight: 40,
    width: 200,
  },
});

export default CustomTextInput;

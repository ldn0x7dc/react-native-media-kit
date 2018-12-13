import React from 'react';
import PropTypes from 'prop-types';
import { createResponder } from 'react-native-gesture-responder';
import { View, Image, Platform, ViewPropTypes } from 'react-native';

export default class Slider extends React.Component {

  static propTypes = {
    ...(ViewPropTypes || View.propTypes),
    minimumValue: PropTypes.number,
    maximumValue: PropTypes.number,
    value: PropTypes.number,
    tracks: PropTypes.array,
    trackContainerStyle: PropTypes.object,
    thumbStyle: PropTypes.object,
    thumbImage: PropTypes.oneOfType([
      PropTypes.shape({
        uri: PropTypes.string
      }),
      PropTypes.number
    ]),

    onValueChange: PropTypes.func,
    onSlidingStart: PropTypes.func,
    onSlidingComplete: PropTypes.func,
    disabled: PropTypes.bool
  };

  static defaultProps = {
    minimumValue: 0,
    maximumValue: 1,
    value: 0,
    trackContainerStyle: {height: 2, backgroundColor: 'gray'},
    thumbStyle: {width: 10, height: 10},
    thumbImage: require('./img/thumb.png'),
    tracks: [
      {
        key: 'thumbTrack',
        style: {backgroundColor: 'white'}
      }
    ],
    disabled: false
  };

  sliding = false;

  constructor (props) {
    super(props);

    this.state = {
      width: 0,
      height: 0,
      value: this.props.value
    };

    this.gestureResponder = createResponder({
      onStartShouldSetResponder: (evt, gestureState) => true,
      onStartShouldSetResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetResponder: (evt, gestureState) => true,
      onMoveShouldSetResponderCapture: (evt, gestureState) => true,
      onResponderGrant: ((evt, gestureState) => {
        this.sliding = true;
        this.props.onSlidingStart && this.props.onSlidingStart(this.state.value);
      }).bind(this),
      onResponderMove: ((evt, gestureState) => {
        const dx = gestureState.moveX - gestureState.previousMoveX;
        const maximumValue = this.props.maximumValue;
        const minimumValue = this.props.minimumValue;
        const w = this.state.width;
        if (maximumValue > minimumValue) {
          const value = dx / w * (maximumValue - minimumValue);
          this.setValue(value + this.state.value);
        }
      }).bind(this),
      onResponderTerminationRequest: (evt, gestureState) => true,
      onResponderRelease: ((evt, gestureState) => {
        this.sliding = false;
        this.props.onSlidingComplete && this.props.onSlidingComplete(this.state.value);
      }).bind(this),
      onResponderTerminate: ((evt, gestureState) => {
        this.sliding = false;
        this.props.onSlidingComplete && this.props.onSlidingComplete(this.state.value);
      }).bind(this)
    });
  }

  setValue (value) {
    value = Math.max(this.props.minimumValue, value);
    value = Math.min(this.props.maximumValue, value);
    if (this.state.value != value) {
      this.setState({value});
    }
  }

  render () {
    let trackViews;
    if (this.props.tracks) {
      trackViews = this.props.tracks.map((track) => {
        return this.renderTrack(track);
      });
    }

    this.ensureThumbSize();
    const thumbWidth = this.props.thumbStyle.width;

    return (
      <View
        {...this.props}
        style={[this.props.style, {alignItems: 'center', flexDirection: 'row'}]}>
        <View
          onLayout={this.onLayout.bind(this)}
          style={[this.props.trackContainerStyle, {flex: 1, overflow: 'hidden', marginHorizontal: thumbWidth / 2}]}>
          {trackViews}
        </View>
        {this.renderThumb()}
      </View>
    );
  }

  ensureThumbSize () {
    if (this.props.thumbStyle && this.props.thumbStyle.width && this.props.thumbStyle.height) {
    } else {
      throw new Error('width and height not specified via this.props.thumbStyle');
    }
  }

  componentWillReceiveProps (nextProps) {
    if (typeof nextProps.value === 'number' && nextProps.value !== this.state.value) {
      this.setState({value: nextProps.value});
    }
  }

  componentDidUpdate (prevProps, prevState) {
    if (this.state.value != prevState.value && this.sliding) {
      this.props.onValueChange && this.props.onValueChange(this.state.value);
    }
  }

  onLayout (e) {
    const {width, height} = e.nativeEvent.layout;
    if (width != this.state.width || height != this.state.height) {
      this.setState({
        width, height
      });
    }
  }

  renderThumb () {
    const maximumValue = this.props.maximumValue;
    const minimumValue = this.props.minimumValue;
    const w = this.state.width;

    let marginLeft = 0;
    if (maximumValue > minimumValue) {
      marginLeft = (this.state.value - minimumValue) / (maximumValue - minimumValue) * w;
    }

    let thumb;
    if (this.props.thumbImage) {
      thumb = (
        <Image
          source={this.props.thumbImage}
          style={[this.props.thumbStyle, {marginLeft: marginLeft, resizeMode: 'contain'}]}/>
      );
    } else {
      thumb = (
        <View
          style={[this.props.thumbStyle, {marginLeft: marginLeft}]}/>
      );
    }

    let gestureResponder = this.gestureResponder;
    if (this.props.disabled) {
      gestureResponder = {};
    }

    return (
      <View
        {...gestureResponder}
        collapsable={false}
        style={{
          position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
          flexDirection: 'row', alignItems: 'center'
        }}>
        {thumb}
      </View>
    );
  }

  renderTrack (config) {
    const maximumValue = this.props.maximumValue;
    const minimumValue = this.props.minimumValue;
    const w = this.state.width;
    let style = {
      ...config.style,
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    };
    let display = false;
    if (maximumValue > minimumValue) {
      let startValue = config.startValue ? config.startValue : minimumValue;
      let endValue = config.endValue ? config.endValue : minimumValue;
      if (config.key === 'thumbTrack') {
        endValue = this.state.value;
      }

      startValue = Math.max(startValue, minimumValue);
      endValue = Math.min(endValue, maximumValue);
      if (endValue > startValue) {
        display = true;
        style.left = (startValue - minimumValue) / (maximumValue - minimumValue) * w;
        style.right = (maximumValue - endValue) / (maximumValue - minimumValue) * w;
      }
    }

    if (display) {
      return (
        <View
          key={config.key}
          style={style}/>
      );
    }
  }
}

// @flow
import React, { Component } from "react";
// $FlowFixMe
import { View, Text, TouchableHighlight, StatusBar } from "react-native";
// $FlowFixMe
import { connect } from "react-redux";

import { ShowTime, ShowDate } from "./ShowTime";
import { Controls } from "./Controls";
import { Colors } from "./Colors";
import { formatColor, scaleColor, viewWidth, fontFit } from "./utils";

import type { ClockState } from "./appstate";

import {
  MIN_BRIGHTNESS,
  MAX_BRIGHTNESS,
  DIMMER_RATIO,
  DIMMER_DWELL,
  MESSAGE_DWELL,
  VERSION
} from "./appstate";

import {
  TOGGLE_SECONDS,
  TOGGLE_DATE,
  TOGGLE_CONTROLS,
  TOGGLE_COLORS,
  SET_DATE,
  SET_BRIGHTNESS,
  SET_COLOR,
  SHOW_MESSAGE
} from "./appstate";

type ClockType = {
  dispatch: Function,
  clock: ClockState
};

class Clock extends Component<ClockType> {
  timerID: IntervalID;

  componentDidMount = () => {
    this.timerID = setInterval(() => this.tick(), 1000);
    StatusBar.setHidden(true);
  };

  componentWillUnmount = () => {
    clearInterval(this.timerID);
  };

  tick = () => {
    this.props.dispatch({ type: SET_DATE, date: new Date() });
  };

  userMessageTimeoutID = undefined;

  showMessage = message => {
    const dispatch = this.props.dispatch;

    // Clear any pending timeout.
    if (this.userMessageTimeoutID) {
      clearTimeout(this.userMessageTimeoutID);
      this.userMessageTimeoutID = undefined;
    }

    // Set a new timeout.
    this.userMessageTimeoutID = setTimeout(
      () => dispatch({ type: SHOW_MESSAGE, userMessage: undefined }),
      MESSAGE_DWELL
    );

    // Activate the message.
    dispatch({
      type: SHOW_MESSAGE,
      userMessage: message
    });
  };

  brightnessTimeoutID = undefined;

  brighterStart = () => {
    this.brightnessEnd();
    this.brighterClick();
    this.brightnessTimeoutID = setTimeout(this.brighterStart, DIMMER_DWELL);
  };

  dimmerStart = () => {
    this.brightnessEnd();
    this.dimmerClick();
    this.brightnessTimeoutID = setTimeout(this.dimmerStart, DIMMER_DWELL);
  };

  brightnessEnd = () => {
    if (this.brightnessTimeoutID) {
      clearTimeout(this.brightnessTimeoutID);
      this.brightnessTimeoutID = undefined;
    }
  };

  brighterClick = () => {
    const old_brightness = this.props.clock.brightness;
    let new_brightness = old_brightness / DIMMER_RATIO;
    if (new_brightness > MAX_BRIGHTNESS) new_brightness = MAX_BRIGHTNESS;
    if (new_brightness !== old_brightness) {
      this.props.dispatch({ type: SET_BRIGHTNESS, brightness: new_brightness });
    }
    let message = `${Math.round(new_brightness * 100)}%`;
    if (new_brightness === old_brightness && this.props.clock.userMessage) {
      message = `${message} Darkest Night Clock ${VERSION}`;
    }
    this.showMessage(message);
  };

  dimmerClick = () => {
    const old_brightness = this.props.clock.brightness;
    let new_brightness = old_brightness * DIMMER_RATIO;
    if (new_brightness < MIN_BRIGHTNESS) new_brightness = MIN_BRIGHTNESS;
    if (new_brightness !== old_brightness) {
      this.props.dispatch({ type: SET_BRIGHTNESS, brightness: new_brightness });
    }
    this.showMessage(`${Math.round(new_brightness * 100)}%`);
  };

  showControlsClick = () => {
    this.props.dispatch({ type: TOGGLE_CONTROLS });
  };

  showColorClick = () => {
    this.props.dispatch({ type: TOGGLE_COLORS });
  };

  setColorClick = color => {
    this.props.dispatch({ type: SET_COLOR, color: color });
  };

  showSecondsClick = () => {
    this.props.dispatch({ type: TOGGLE_SECONDS });
  };

  showDateClick = () => {
    this.props.dispatch({ type: TOGGLE_DATE });
  };

  render() {
    const clock = this.props.clock;
    const color = formatColor(scaleColor(clock.color, clock.brightness));
    const width = viewWidth();
    const controlWidth = fontFit("Control Icons", width, 0.8);

    const message = {
      color: "white",
      height: 20
    };

    return (
      <View style={{ alignItems: "center" }}>
        <TouchableHighlight onPress={this.showControlsClick}>
          <View style={{ alignItems: "center" }}>
            <Text style={message}>{clock.userMessage}</Text>

            <ShowTime
              date={clock.date}
              showSeconds={clock.showSeconds}
              color={color}
            />

            {clock.showDate ? (
              <ShowDate date={clock.date} color={color} />
            ) : (
              undefined
            )}
          </View>
        </TouchableHighlight>

        {clock.showControls ? (
          <View style={{ alignItems: "center" }}>
            {clock.showColors ? (
              <Colors size={controlWidth} click={this.setColorClick} />
            ) : (
              <Controls size={controlWidth} clock={this} />
            )}
          </View>
        ) : (
          undefined
        )}
      </View>
    );
  }
}

function mapStateToProps(state: ClockState) {
  return { clock: state };
}

export default connect(mapStateToProps)(Clock);

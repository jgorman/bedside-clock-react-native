// @flow
import React from "react";
// $FlowFixMe
import { View, Text, TouchableHighlight } from "react-native";
import { Controls } from "./Controls";
import { Colors } from "./Colors";

import type { ClockState } from "./appstate";

export const ClockRender = (clock: Object, state: ClockState, calc: Object) => {

  const message_style = {
    color: "white",
    fontSize: calc.message_h,
    height: calc.message_h * 1.5
  };

  const time_box_style = {
    height: calc.time_h * 0.85,
    justifyContent: "center"
  };
  const time_text_style = {
    color: calc.color,
    fontSize: calc.time_h
  };

  const date_box_style = {
    height: calc.date_h * 0.85,
    justifyContent: "center"
  };
  const date_text_style = {
    color: calc.color,
    fontSize: calc.date_h
  };

  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ alignItems: "center" }}
        onStartShouldSetResponder={() => true}
        onResponderTerminationRequest={() => true}
        onResponderGrant={clock.brightnessStart}
        onResponderMove={clock.brightnessMove}
        onResponderRelease={clock.brightnessEnd}
        onResponderTerminate={clock.brightnessEnd}
      >

        <Text style={message_style}>{state.userMessage}</Text>

        <View style={time_box_style}>
          <Text style={time_text_style}>{calc.time_s}</Text>
        </View>

        {state.showDate ? (
          <View style={date_box_style}>
            <Text style={date_text_style}>{calc.date_s}</Text>
          </View>
        ) : (
          undefined
        )}

      </View>

      {state.showControls ? (
        <View style={{ alignItems: "center" }}>
          {state.showColors ? (
            <Colors size={calc.control_h} click={clock.setColorClick} />
          ) : (
            <Controls size={calc.control_h} clock={clock} />
          )}
        </View>
      ) : (
        undefined
      )}
    </View>
  );
};

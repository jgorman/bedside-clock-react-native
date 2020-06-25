/* Clock component. */

import { useReducer, useEffect } from "react"

import { bootState, bootClock, isNative, getViewPort } from "./platform"
import { reducer } from "./reducer"
import { ClockRender } from "./ClockRender"

import {
  MIN_BRIGHTNESS,
  MAX_BRIGHTNESS,
  DIMMER_RATIO,
  DIMMER_DWELL,
  MESSAGE_DWELL,
  MIN_SLIDING,
  VERSION,
} from "./appstate"

let state, dispatch
const build = "-3"

// Phone touch handling.
let touchInterface = false // If we are getting touch events we disable clicks.
let touchId = undefined // Are we still in an ongoing touch stream?
let touchFirstX = 0 // First x in this touch stream.
let touchLatestX = 0 // Latest or last x in this touch stream.
let pressingTimeoutID = undefined // Hold and press repeat action timer.

const Clock = () => {
  ;[state, dispatch] = useReducer(reducer, undefined, bootState)

  useEffect(() => {
    bootClock(dispatch)
    const timerID = setInterval(() => dispatch({ type: "clock_tick" }), 1000)
    return () => clearInterval(timerID)
  }, [])

  if (isNative && !state.color) {
    return null // Native waits for async initial state reading.
  }

  return ClockRender(state, actions)
}

// User actions.
const actions = {
  // Control actions.

  showControlsClick: () => dispatch({ type: "toggle_controls" }),

  showColorClick: () => dispatch({ type: "toggle_colors" }),

  setColorClick: (color) => dispatch({ type: "set_color", color }),

  showSecondsClick: () => dispatch({ type: "toggle_seconds" }),

  showDateClick: () => dispatch({ type: "toggle_date" }),

  // Desktop browser brightness click actions.

  dimmerClick: () => {
    if (touchInterface) return // Touch interface wins.
    dimmerTick()
  },

  brighterClick: () => {
    if (touchInterface) return // Touch interface wins.
    brighterTick()
  },

  redisplay: () => dispatch({ type: "redisplay" }),
}

/*
 * Phone presses and clicks on the brighter / dimmer buttons.
 * Phone browsers call onTouchStart/onTouchEnd so we can run continuous
 * brightening or dimming while pressing and ignore the click events.
 * Desktop browsers run on clicks alone.
 */

// Keep calling ourselves until endPress cancels the timer.
const dimmerPress = (e) => {
  // if (e) e.preventDefault() // TODO: Prevent save image on ios.chrome.
  touchInterface = true
  endPress()
  pressingTimeoutID = setTimeout(dimmerPress, DIMMER_DWELL)
  dimmerTick()
}
actions.dimmerPress = dimmerPress

// Keep calling ourselves until endPress cancels the timer.
const brighterPress = (e) => {
  // if (e) e.preventDefault() // TODO: Prevent save image on ios.chrome.
  touchInterface = true
  endPress()
  pressingTimeoutID = setTimeout(brighterPress, DIMMER_DWELL)
  brighterTick()
}
actions.brighterPress = brighterPress

// Cancel the pressing timer.
const endPress = () => {
  if (pressingTimeoutID) {
    clearTimeout(pressingTimeoutID)
    pressingTimeoutID = undefined
  }
}
actions.endPress = endPress

// One tick dimmer.
const dimmerTick = () => {
  const old_brightness = state.brightness
  let brightness = old_brightness * DIMMER_RATIO
  if (brightness < MIN_BRIGHTNESS) brightness = MIN_BRIGHTNESS

  const message = `${Math.round(brightness * 100)}%`
  if (brightness === old_brightness) {
    endPress() // Catch runaway press on ios.chrome.
  }
  dispatch({ type: "set_brightness", brightness })
  showMessage(message)
}

// One tick brighter.
const brighterTick = () => {
  const old_brightness = state.brightness
  let brightness = old_brightness / DIMMER_RATIO
  if (brightness > MAX_BRIGHTNESS) brightness = MAX_BRIGHTNESS
  let message = `${Math.round(brightness * 100)}%`

  if (brightness === old_brightness) {
    endPress() // Catch runaway press on ios.chrome.
    message += show_version()
  }

  dispatch({ type: "set_brightness", brightness })
  showMessage(message)
}

/*
 * These functions handle brightness swiping on the time & date display.
 */

const brightnessStart = (e) => {
  if (e.nativeEvent) e = e.nativeEvent
  const touch = e.changedTouches[0]
  if (touch) {
    touchId = touch.identifier
    touchFirstX = touch.pageX
    touchLatestX = touch.pageX
  }
}
actions.brightnessStart = brightnessStart

const brightnessMove = (e) => {
  if (e.nativeEvent) e = e.nativeEvent
  const touch = e.changedTouches[0]
  if (touch) {
    brightnessDiff(touch.identifier, touch.pageX)
  }
}
actions.brightnessMove = brightnessMove

const brightnessEnd = (e) => {
  e.preventDefault() // Prevent text highlighting in phone browsers.
  if (e.nativeEvent) e = e.nativeEvent
  const touch = e.changedTouches[0]
  if (touch) {
    brightnessDiff(touch.identifier, touch.pageX)
  }
  if (Math.abs(touchFirstX - touchLatestX) < MIN_SLIDING) {
    // If there was very little movement, treat it like a click.
    showMessage("Swipe left to dim.")
    actions.showControlsClick()
  }
  touchInterface = true
  touchId = undefined
}
actions.brightnessEnd = brightnessEnd

const brightnessDiff = (id, x) => {
  if (id !== touchId || touchLatestX === x) return
  const diff = x - touchLatestX
  const old_brightness = state.brightness
  const viewPort = getViewPort()
  let brightness = old_brightness + (2 * diff) / viewPort[0]
  if (brightness < MIN_BRIGHTNESS) brightness = MIN_BRIGHTNESS
  if (brightness > MAX_BRIGHTNESS) brightness = MAX_BRIGHTNESS

  let message = `${Math.round(brightness * 100)}%`
  if (brightness === old_brightness && diff > 0) {
    message += show_version()
  } else {
    dispatch({ type: "set_brightness", brightness })
  }

  touchLatestX = x
  showMessage(message)
}

const showMessage = (message) => {
  // Clear any pending timeout.
  if (showMessage.timeoutID) {
    clearTimeout(showMessage.timeoutID)
    showMessage.timeoutID = undefined
  }

  // Set the message erase timeout.
  showMessage.timeoutID = setTimeout(
    () => dispatch({ type: "show_message", message: undefined }),
    MESSAGE_DWELL
  )

  // Show the message.
  dispatch({ type: "show_message", message })
}

const show_version = () =>
  ` Darkest Night Clock ${isNative ? "App" : ""} ${VERSION}${build}`

export default Clock

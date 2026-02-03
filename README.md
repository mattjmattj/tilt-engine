# Tilt-engine

A very basic 2d game engine, primarily meant for using mobile phones tilting as controls

## Installation

Tilt-engine is not yet published on npm. `git clone` is the only way as of now.

## Features

Tilt-engine is a 2d engine written in javascript. It serves two main purposes:
- make it easy to create simple games using mobile device accelerometer/gyro as source of input, and a canvas for rendering
- fulfill my will to dig into game engines stuff, collisions, etc.

Partial list of features / principles :
- object-oriented design (`GameObject`)
- collision detection with two types of `Collider`s (AABB only)
    - `CircleCollider`
    - `RectCollider`
- physics (`RigidBody`) : mass, speed, friction, bounciness
- mobile tilting as controls (possible emulation with arrow keys, for development purpose)
- optional and seemless double buffering

## Important notice

- Tilt-engine uses `DeviceMotionEvent` events under the hood. Those events require a **secure context** in order to work, so you will have to use a valid HTTPS connection. Please read https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent.
- Tilt-engine does not ask for permission for using device sensors, which is required on iOS. You will have to do that by yourself.
- Using tilting as controls may interfere with device orientation. I highly advise you to request fullscreen and lock the device orientation before actually starting the game

## Demo games

- [Playground](https://mattjmattj.github.io/tilt-engine/playground/) : simple physics and controls demo
- [Pocket Level](https://mattjmattj.github.io/tilt-engine/level/) : not really a game, but uses tilt-engine to make a pocket level

## Documentation

Further documentation will be made available after demo games. Hopefully the demo games will provide enough information for anyone to play with the engine

## License

MIT
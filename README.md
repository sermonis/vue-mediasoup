# mediasoup-vue

A vue3 demo application of [mediasoup](https://mediasoup.org) **v3**

It's not perfect yet, and hopefully someone who can do it will help perfect it

## Configuration via query parameters

By adding query parameters into the URL you can set certain settings of the application:

| Parameter          | Type    | Description          | Default Value |
| ------------------ | ------- | -------------------- | ------------- |
| `roomId`           | String  | Id of the room      | Autogenerated  |
| `displayName`      | String  | Display name of your participant | Autogenerated |
| `handlerName`      | String  | Handler name of the mediasoup-client `Device` instance | Autodetected |
| `forceTcp`         | Boolean | Force RTC (audio/video/datachannel) over TCP instead of UDP | `false` |
| `produce`          | Boolean | Enable sending of audio/video | `true`  |
| `consume`          | Boolean | Enable reception of audio/video | `true` |
| `datachannel`      | Boolean | Enable DataChannels | `true` |
| `forceVP8`        | Boolean | Force VP8 codec for webcam and screen sharing | `false` |
| `forceH264`        | Boolean | Force H264 codec for webcam and screen sharing | `false` |
| `forceVP9`        | Boolean | Force VP9 codec for webcam and screen sharing | `false` |
| `enableWebcamLayers` | Boolean | Enable simulcast or SVC for webcam | `true` |
| `enableSharingLayers` | Boolean | Enable simulcast or SVC for screen sharing | `true` |
| `webcamScalabilityMode` | String | `scalabilityMode` for webcam | 'L1T3' for VP8/H264 (in each simulcast encoding), 'L3T3_KEY' for VP9 |
| `sharingScalabilityMode` | String | `scalabilityMode` for screen sharing | 'L1T3' for VP8/H264 (in each simulcast encoding), 'L3T3' for VP9 |
| `numSimulcastStreams` | Number | Number of streams for simulcast in webcam and screen sharing | 3 |
| `info`             | Boolean | Display detailed information about media transmission | `false` |
| `faceDetection`    | Boolean | Run face detection | `false` |
| `externalVideo`    | Boolean | Send an external video instead of local webcam | `false` |
| `e2eKey`           | String | Key for media E2E encryption/decryption (just works with some OPUS and VP8 codecs) | |
| `consumerReplicas` | Number | Create artificial replicas of yourself and receive their audio and video (not displayed in the UI) | 0 |

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

- Ensure you have installed the dependencies required by mediasoup to build.

```shell
sudo apt install python3-pip -y
```

- Clone the project:

```shell
git clone https://github.com/explore-pu/mediasoup-vue.git

cd mediasoup-vue
```

- Copy `config.example.js` as `config.js` and customize it for your scenario:

```shell
cp config.example.js config.js
```

- Install nodejs dependencies

```shell
npm install
```

- Run the mediasoup server

```shell
npm run server
```

- Run the app with develop，https://localhost:5173/

```sh
npm run dev
```

- Run the app with production，The output directory is `public`

```sh
npm run build
```

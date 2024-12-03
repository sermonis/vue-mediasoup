import protooClient from 'protoo-client';
import * as mediasoupClient from 'mediasoup-client';
// import { getProtooUrl } from './urlFactory';
// import * as cookiesManager from './CookiesManager';
// import * as requestActions from './redux/requestActions';
// import * as stateActions from './redux/stateActions';
// import * as e2e from './e2e';
import {useStore} from "@/stores/index.js";

const VIDEO_CONSTRAINS = {
  qvga: {width: {ideal: 320}, height: {ideal: 240}},
  vga: {width: {ideal: 640}, height: {ideal: 480}},
  hd: {width: {ideal: 1280}, height: {ideal: 720}}
};

const PC_PROPRIETARY_CONSTRAINTS = {
  // optional : [ { googDscp: true } ]
};

const EXTERNAL_VIDEO_SRC = '/resources/videos/video-audio-stereo.mp4';

export default class RoomClient {
  constructor(
    {
      roomId,
      peerId,
      displayName,
      device,
      handlerName,
      forceTcp,
      produce,
      consume,
      datachannel,
      enableWebcamLayers,
      enableSharingLayers,
      webcamScalabilityMode,
      sharingScalabilityMode,
      numSimulcastStreams,
      forceVP8,
      forceH264,
      forceVP9,
      externalVideo,
      e2eKey,
      consumerReplicas
    }
  ) {
    console.info('constructor() [roomId:"%s", peerId:"%s", displayName:"%s", device:%s]', roomId, peerId, displayName, device.flag);

    this.store = useStore();

    // Closed flag.
    // @type {Boolean}
    this._closed = false;

    // Display name.
    // @type {String}
    this._displayName = displayName;

    // Device info.
    // @type {Object}
    this._device = device;

    // Custom mediasoup-client handler name (to override default browser
    // detection if desired).
    // @type {String}
    this._handlerName = handlerName;

    // Whether we want to force RTC over TCP.
    // @type {Boolean}
    this._forceTcp = forceTcp;

    // Whether we want to produce audio/video.
    // @type {Boolean}
    this._produce = produce;

    // Whether we should consume.
    // @type {Boolean}
    this._consume = consume;

    // Whether we want DataChannels.
    // @type {Boolean}
    this._useDataChannel = Boolean(datachannel);

    // Force VP8 codec for sending.
    // @type {Boolean}
    this._forceVP8 = Boolean(forceVP8);

    // Force H264 codec for sending.
    // @type {Boolean}
    this._forceH264 = Boolean(forceH264);

    // Force VP9 codec for sending.
    // @type {Boolean}
    this._forceVP9 = Boolean(forceVP9);

    // Whether simulcast or SVC should be used for webcam.
    // @type {Boolean}
    this._enableWebcamLayers = Boolean(enableWebcamLayers);

    // Whether simulcast or SVC should be used in desktop sharing.
    // @type {Boolean}
    this._enableSharingLayers = Boolean(enableSharingLayers);

    // Scalability mode for webcam.
    // @type {String}
    this._webcamScalabilityMode = webcamScalabilityMode;

    // Scalability mode for sharing.
    // @type {String}
    this._sharingScalabilityMode = sharingScalabilityMode;

    // Number of simuclast streams for webcam and sharing.
    // @type {Number}
    this._numSimulcastStreams = numSimulcastStreams;

    // External video.
    // @type {HTMLVideoElement}
    this._externalVideo = null;

    // Enabled end-to-end encryption.
    this._e2eKey = e2eKey;

    // MediaStream of the external video.
    // @type {MediaStream}
    this._externalVideoStream = null;

    // Next expected dataChannel test number.
    // @type {Number}
    this._nextDataChannelTestNumber = 0;

    if (externalVideo) {
      this._externalVideo = document.createElement('video');

      this._externalVideo.controls = true;
      this._externalVideo.muted = true;
      this._externalVideo.loop = true;
      this._externalVideo.setAttribute('playsinline', '');
      this._externalVideo.src = EXTERNAL_VIDEO_SRC;

      this._externalVideo.play()
        .catch((error) => console.warn('externalVideo.play() failed:%o', error));
    }

    // Protoo URL.
    // @type {String}
    this._protooUrl = `wss://${window.location.hostname}:4443/?roomId=${roomId}&peerId=${peerId}&consumerReplicas=${consumerReplicas}`;

    // protoo-client Peer instance.
    // @type {protooClient.Peer}
    this._protoo = null;

    // mediasoup-client Device instance.
    // @type {mediasoupClient.Device}
    this._mediasoupDevice = null;

    // mediasoup Transport for sending.
    // @type {mediasoupClient.Transport}
    this._sendTransport = null;

    // mediasoup Transport for receiving.
    // @type {mediasoupClient.Transport}
    this._recvTransport = null;

    // Local mic mediasoup Producer.
    // @type {mediasoupClient.Producer}
    this._micProducer = null;

    // Local webcam mediasoup Producer.
    // @type {mediasoupClient.Producer}
    this._webcamProducer = null;

    // Local share mediasoup Producer.
    // @type {mediasoupClient.Producer}
    this._shareProducer = null;

    // Local chat DataProducer.
    // @type {mediasoupClient.DataProducer}
    this._chatDataProducer = null;

    // Local bot DataProducer.
    // @type {mediasoupClient.DataProducer}
    this._botDataProducer = null;

    // mediasoup Consumers.
    // @type {Map<String, mediasoupClient.Consumer>}
    this._consumers = new Map();

    // mediasoup DataConsumers.
    // @type {Map<String, mediasoupClient.DataConsumer>}
    this._dataConsumers = new Map();

    // Map of webcam MediaDeviceInfos indexed by deviceId.
    // @type {Map<String, MediaDeviceInfos>}
    this._webcams = new Map();

    // Local Webcam.
    // @type {Object} with:
    // - {MediaDeviceInfo} [device]
    // - {String} [resolution] - 'qvga' / 'vga' / 'hd'.
    this._webcam =
      {
        device: null,
        resolution: 'hd'
      };

    if (this._e2eKey && e2e.isSupported()) {
      e2e.setCryptoKey('setCryptoKey', this._e2eKey, true);
    }
  }

  close() {
    console.info('close()');

    if (this._closed) {
      return;
    }

    this._closed = true;

    // Close protoo Peer
    this._protoo.close();

    // Close mediasoup Transports.
    if (this._sendTransport) {
      this._sendTransport.close();
    }

    if (this._recvTransport) {
      this._recvTransport.close();
    }

    this.store.setRoomState('closed');
  }

  async join() {
    this.store.setMediasoupClientVersion(mediasoupClient.version);

    const protooTransport = new protooClient.WebSocketTransport(this._protooUrl);

    this._protoo = new protooClient.Peer(protooTransport);

    this.store.setRoomState('connecting');

    this._protoo.on('open', () => this._joinRoom());

    this._protoo.on('failed', () => {
      this.store.addNotification({
        type: 'error',
        text: 'WebSocket connection failed'
      });
    });

    this._protoo.on('disconnected', () => {
      this.store.addNotification({
        type: 'error',
        text: 'WebSocket disconnected'
      });

      // Close mediasoup Transports.
      if (this._sendTransport) {
        this._sendTransport.close();
        this._sendTransport = null;
      }

      if (this._recvTransport) {
        this._recvTransport.close();
        this._recvTransport = null;
      }

      this.store.setRoomState('closed');
    });

    this._protoo.on('close', () => {
      if (this._closed) {
        return;
      }

      this.close();
    });

    // eslint-disable-next-line no-unused-vars
    this._protoo.on('request', async (request, accept, reject) => {
      console.info('proto "request" event [method:%s, data:%o]', request.method, request.data);

      switch (request.method) {
        case 'newConsumer': {
          if (!this._consume) {
            reject(403, 'I do not want to consume');

            break;
          }

          const {
            peerId,
            producerId,
            id,
            kind,
            rtpParameters,
            type,
            appData,
            producerPaused
          } = request.data;

          try {
            const consumer = await this._recvTransport.consume({
              id,
              producerId,
              kind,
              rtpParameters,
              // NOTE: Force streamId to be same in mic and webcam and different
              // in screen sharing so libwebrtc will just try to sync mic and
              // webcam streams from the same remote peer.
              streamId: `${peerId}-${appData.share ? 'share' : 'mic-webcam'}`,
              appData: {...appData, peerId} // Trick.
            });

            if (this._e2eKey && e2e.isSupported()) {
              e2e.setupReceiverTransform(consumer.rtpReceiver);
            }

            // Store in the map.
            this._consumers.set(consumer.id, consumer);

            consumer.on('transportclose', () => {
              this._consumers.delete(consumer.id);
            });

            const {
              spatialLayers,
              temporalLayers
            } = mediasoupClient.parseScalabilityMode(consumer.rtpParameters.encodings[0].scalabilityMode);

            this.store.addConsumer(
              {
                id: consumer.id,
                type: type,
                locallyPaused: false,
                remotelyPaused: producerPaused,
                rtpParameters: consumer.rtpParameters,
                spatialLayers: spatialLayers,
                temporalLayers: temporalLayers,
                preferredSpatialLayer: spatialLayers - 1,
                preferredTemporalLayer: temporalLayers - 1,
                priority: 1,
                codec: consumer.rtpParameters.codecs[0].mimeType.split('/')[1],
                track: consumer.track
              },
              peerId);

            // We are ready. Answer the protoo request so the server will
            // resume this Consumer (which was paused for now if video).
            accept();

            // If audio-only mode is enabled, pause it.
            if (consumer.kind === 'video' && this.store.me.audioOnly) {
              await this._pauseConsumer(consumer);
            }
          } catch (error) {
            console.error('"newConsumer" request failed:%o', error);

            this.store.addNotification({
              type: 'error',
              text: `Error creating a Consumer: ${error}`
            });

            throw error;
          }

          break;
        }

        case 'newDataConsumer': {
          if (!this._consume) {
            reject(403, 'I do not want to data consume');

            break;
          }

          if (!this._useDataChannel) {
            reject(403, 'I do not want DataChannels');

            break;
          }

          const {
            peerId, // NOTE: Null if bot.
            dataProducerId,
            id,
            sctpStreamParameters,
            label,
            protocol,
            appData
          } = request.data;

          try {
            const dataConsumer = await this._recvTransport.consumeData({
              id,
              dataProducerId,
              sctpStreamParameters,
              label,
              protocol,
              appData: {...appData, peerId} // Trick.
            });

            // Store in the map.
            this._dataConsumers.set(dataConsumer.id, dataConsumer);

            dataConsumer.on('transportclose', () => {
              this._dataConsumers.delete(dataConsumer.id);
            });

            dataConsumer.on('open', () => {
              console.info('DataConsumer "open" event');
            });

            dataConsumer.on('close', () => {
              console.warn('DataConsumer "close" event');

              this._dataConsumers.delete(dataConsumer.id);

              this.store.addNotification({
                type: 'error',
                text: 'DataConsumer closed'
              });
            });

            dataConsumer.on('error', (error) => {
              console.error('DataConsumer "error" event:%o', error);

              this.store.addNotification({
                type: 'error',
                text: `DataConsumer error: ${error}`
              });
            });

            dataConsumer.on('message', (message) => {
              console.info('DataConsumer "message" event [streamId:%d]', dataConsumer.sctpStreamParameters.streamId);

              // TODO: For debugging.
              window.DC_MESSAGE = message;

              if (message instanceof ArrayBuffer) {
                const view = new DataView(message);
                const number = view.getUint32();

                if (number === Math.pow(2, 32) - 1) {
                  console.warn('dataChannelTest finished!');

                  this._nextDataChannelTestNumber = 0;

                  return;
                }

                if (number > this._nextDataChannelTestNumber) {
                  console.warn('dataChannelTest: %s packets missing', number - this._nextDataChannelTestNumber);
                }

                this._nextDataChannelTestNumber = number + 1;

                return;
              } else if (typeof message !== 'string') {
                console.warn('ignoring DataConsumer "message" (not a string)');

                return;
              }

              switch (dataConsumer.label) {
                case 'chat': {
                  const {peers} = store.getState();
                  const peersArray = Object.keys(peers).map((_peerId) => peers[_peerId]);
                  const sendingPeer = peersArray.find((peer) => peer.dataConsumers.includes(dataConsumer.id));

                  if (!sendingPeer) {
                    console.warn('DataConsumer "message" from unknown peer');

                    break;
                  }

                  this.store.addNotification({
                    title: `${sendingPeer.displayName} says:`,
                    text: message,
                    timeout: 500
                  });

                  break;
                }

                case 'bot': {
                  this.store.addNotification({
                    title: 'Message from Bot:',
                    text: message,
                    timeout: 500
                  });

                  break;
                }
              }
            });

            // TODO: REMOVE
            window.DC = dataConsumer;

            this.store.addDataConsumer(
              {
                id: dataConsumer.id,
                sctpStreamParameters: dataConsumer.sctpStreamParameters,
                label: dataConsumer.label,
                protocol: dataConsumer.protocol
              },
              peerId);

            // We are ready. Answer the protoo request.
            accept();
          } catch (error) {
            console.error('"newDataConsumer" request failed:%o', error);

            this.store.addNotification({
              type: 'error',
              text: `Error creating a DataConsumer: ${error}`
            });

            throw error;
          }

          break;
        }
      }
    });

    this._protoo.on('notification', (notification) => {
      console.info('proto "notification" event [method:%s, data:%o]', notification.method, notification.data);

      switch (notification.method) {
        case 'mediasoup-version': {
          const {version} = notification.data;

          this.store.setMediasoupVersion(version);

          break;
        }

        case 'producerScore': {
          const {producerId, score} = notification.data;

          this.store.setProducerScore(producerId, score);

          break;
        }

        case 'newPeer': {
          const peer = notification.data;

          this.store.addPeer({...peer, consumers: [], dataConsumers: []});

          this.store.addNotification({
            text: `${peer.displayName} has joined the room`
          });

          break;
        }

        case 'peerClosed': {
          const {peerId} = notification.data;

          this.store.removePeer(peerId);

          break;
        }

        case 'peerDisplayNameChanged': {
          const {peerId, displayName, oldDisplayName} = notification.data;

          this.store.setPeerDisplayName(displayName, peerId);

          this.store.addNotification({
            text: `${oldDisplayName} is now ${displayName}`
          });

          break;
        }

        case 'downlinkBwe': {
          console.info('\'downlinkBwe\' event:%o', notification.data);

          break;
        }

        case 'consumerClosed': {
          const {consumerId} = notification.data;
          const consumer = this._consumers.get(consumerId);

          if (!consumer)
            break;

          consumer.close();
          this._consumers.delete(consumerId);

          const {peerId} = consumer.appData;

          this.store.removeConsumer(consumerId, peerId);

          break;
        }

        case 'consumerPaused': {
          const {consumerId} = notification.data;
          const consumer = this._consumers.get(consumerId);

          if (!consumer)
            break;

          consumer.pause();

          this.store.setConsumerPaused(consumerId, 'remote');

          break;
        }

        case 'consumerResumed': {
          const {consumerId} = notification.data;
          const consumer = this._consumers.get(consumerId);

          if (!consumer)
            break;

          consumer.resume();

          this.store.setConsumerResumed(consumerId, 'remote');

          break;
        }

        case 'consumerLayersChanged': {
          const {consumerId, spatialLayer, temporalLayer} = notification.data;
          const consumer = this._consumers.get(consumerId);

          if (!consumer)
            break;

          this.store.setConsumerCurrentLayers(consumerId, spatialLayer, temporalLayer);

          break;
        }

        case 'consumerScore': {
          const {consumerId, score} = notification.data;

          this.store.setConsumerScore(consumerId, score);

          break;
        }

        case 'dataConsumerClosed': {
          const {dataConsumerId} = notification.data;
          const dataConsumer = this._dataConsumers.get(dataConsumerId);

          if (!dataConsumer)
            break;

          dataConsumer.close();
          this._dataConsumers.delete(dataConsumerId);

          const {peerId} = dataConsumer.appData;

          this.store.removeDataConsumer(dataConsumerId, peerId);

          break;
        }

        case 'activeSpeaker': {
          const {peerId} = notification.data;

          this.store.setRoomActiveSpeaker(peerId);

          break;
        }

        default: {
          console.error(
            'unknown protoo notification.method "%s"', notification.method);
        }
      }
    });
  }

  async enableMic() {
    console.info('enableMic()');

    if (this._micProducer)
      return;

    if (!this._mediasoupDevice.canProduce('audio')) {
      console.error('enableMic() | cannot produce audio');

      return;
    }

    let track;

    try {
      if (!this._externalVideo) {
        console.info('enableMic() | calling getUserMedia()');

        const stream = await navigator.mediaDevices.getUserMedia({audio: true});

        track = stream.getAudioTracks()[0];
      } else {
        const stream = await this._getExternalVideoStream();

        track = stream.getAudioTracks()[0].clone();
      }

      this._micProducer = await this._sendTransport.produce(
        {
          track,
          codecOptions:
            {
              opusStereo: true,
              opusDtx: true,
              opusFec: true,
              opusNack: true
            }
          // NOTE: for testing codec selection.
          // codec : this._mediasoupDevice.rtpCapabilities.codecs
          // 	.find((codec) => codec.mimeType.toLowerCase() === 'audio/pcma')
        });

      sessionStorage.setItem('micEnabled', 'true');

      if (this._e2eKey && e2e.isSupported()) {
        e2e.setupSenderTransform(this._micProducer.rtpSender);
      }

      this.store.addProducer(
        {
          id: this._micProducer.id,
          paused: this._micProducer.paused,
          track: this._micProducer.track,
          rtpParameters: this._micProducer.rtpParameters,
          codec: this._micProducer.rtpParameters.codecs[0].mimeType.split('/')[1]
        });

      this._micProducer.on('transportclose', () => {
        this._micProducer = null;
      });

      this._micProducer.on('trackended', () => {
        this.store.addNotification(
          {
            type: 'error',
            text: 'Microphone disconnected!'
          });

        this.disableMic()
          .catch(() => {
          });
      });
    } catch (error) {
      console.error('enableMic() | failed:%o', error);

      this.store.addNotification(
        {
          type: 'error',
          text: `Error enabling microphone: ${error}`
        });

      if (track)
        track.stop();
    }
  }

  async disableMic() {
    console.info('disableMic()');

    if (!this._micProducer)
      return;

    this._micProducer.close();

    this.store.removeProducer(this._micProducer.id);

    try {
      await this._protoo.request('closeProducer', {producerId: this._micProducer.id});

      sessionStorage.setItem('micEnabled', 'false');

    } catch (error) {
      this.store.addNotification({
        type: 'error',
        text: `Error closing server-side mic Producer: ${error}`
      });
    }

    this._micProducer = null;
  }

  async muteMic() {
    console.info('muteMic()');

    this._micProducer.pause();

    try {
      await this._protoo.request(
        'pauseProducer', {producerId: this._micProducer.id});

      this.store.setProducerPaused(this._micProducer.id);
    } catch (error) {
      console.error('muteMic() | failed: %o', error);

      this.store.addNotification(
        {
          type: 'error',
          text: `Error pausing server-side mic Producer: ${error}`
        });
    }
  }

  async unmuteMic() {
    console.info('unmuteMic()');

    this._micProducer.resume();

    try {
      await this._protoo.request(
        'resumeProducer', {producerId: this._micProducer.id});

      this.store.setProducerResumed(this._micProducer.id);
    } catch (error) {
      console.error('unmuteMic() | failed: %o', error);

      this.store.addNotification(
        {
          type: 'error',
          text: `Error resuming server-side mic Producer: ${error}`
        });
    }
  }

  async enableWebcam() {
    console.info('enableWebcam()');

    if (this._webcamProducer)
      return;
    else if (this._shareProducer)
      await this.disableShare();

    if (!this._mediasoupDevice.canProduce('video')) {
      console.error('enableWebcam() | cannot produce video');

      return;
    }

    let track;
    let device;

    this.store.setWebcamInProgress(true);

    try {
      if (!this._externalVideo) {
        await this._updateWebcams();
        device = this._webcam.device;

        const {resolution} = this._webcam;

        if (!device) {
          throw new Error('no webcam devices');
        }

        console.info('enableWebcam() | calling getUserMedia()');

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: {ideal: device.deviceId},
            ...VIDEO_CONSTRAINS[resolution]
          }
        });

        track = stream.getVideoTracks()[0];
      } else {
        device = {label: 'external video'};

        const stream = await this._getExternalVideoStream();

        track = stream.getVideoTracks()[0].clone();
      }

      let encodings;
      let codec;
      const codecOptions =
        {
          videoGoogleStartBitrate: 1000
        };

      if (this._forceVP8) {
        codec = this._mediasoupDevice.rtpCapabilities.codecs
          .find((c) => c.mimeType.toLowerCase() === 'video/vp8');

        if (!codec) {
          throw new Error('desired VP8 codec+configuration is not supported');
        }
      } else if (this._forceH264) {
        codec = this._mediasoupDevice.rtpCapabilities.codecs
          .find((c) => c.mimeType.toLowerCase() === 'video/h264');

        if (!codec) {
          throw new Error('desired H264 codec+configuration is not supported');
        }
      } else if (this._forceVP9) {
        codec = this._mediasoupDevice.rtpCapabilities.codecs
          .find((c) => c.mimeType.toLowerCase() === 'video/vp9');

        if (!codec) {
          throw new Error('desired VP9 codec+configuration is not supported');
        }
      }

      if (this._enableWebcamLayers) {
        // If VP9 is the only available video codec then use SVC.
        const firstVideoCodec = this._mediasoupDevice
          .rtpCapabilities
          .codecs
          .find((c) => c.kind === 'video');

        // VP9 with SVC.
        if (
          (this._forceVP9 && codec) ||
          firstVideoCodec.mimeType.toLowerCase() === 'video/vp9'
        ) {
          encodings =
            [
              {
                maxBitrate: 5000000,
                scalabilityMode: this._webcamScalabilityMode || 'L3T3_KEY'
              }
            ];
        }
        // VP8 or H264 with simulcast.
        else {
          encodings =
            [
              {
                scaleResolutionDownBy: 1,
                maxBitrate: 5000000,
                scalabilityMode: this._webcamScalabilityMode || 'L1T3'
              }
            ];

          if (this._numSimulcastStreams > 1) {
            encodings.unshift(
              {
                scaleResolutionDownBy: 2,
                maxBitrate: 1000000,
                scalabilityMode: this._webcamScalabilityMode || 'L1T3'
              }
            );
          }

          if (this._numSimulcastStreams > 2) {
            encodings.unshift(
              {
                scaleResolutionDownBy: 4,
                maxBitrate: 500000,
                scalabilityMode: this._webcamScalabilityMode || 'L1T3'
              }
            );
          }
        }
      }

      this._webcamProducer = await this._sendTransport.produce(
        {
          track,
          encodings,
          codecOptions,
          codec
        });

      sessionStorage.setItem('webcamEnabled', 'true');

      if (this._e2eKey && e2e.isSupported()) {
        e2e.setupSenderTransform(this._webcamProducer.rtpSender);
      }

      this.store.addProducer(
        {
          id: this._webcamProducer.id,
          deviceLabel: device.label,
          type: this._getWebcamType(device),
          paused: this._webcamProducer.paused,
          track: this._webcamProducer.track,
          rtpParameters: this._webcamProducer.rtpParameters,
          codec: this._webcamProducer.rtpParameters.codecs[0].mimeType.split('/')[1]
        });

      this._webcamProducer.on('transportclose', () => {
        this._webcamProducer = null;
      });

      this._webcamProducer.on('trackended', () => {
        this.store.addNotification(
          {
            type: 'error',
            text: 'Webcam disconnected!'
          });

        this.disableWebcam()
          .catch(() => {
          });
      });
    } catch (error) {
      console.error('enableWebcam() | failed:%o', error);

      this.store.addNotification(
        {
          type: 'error',
          text: `Error enabling webcam: ${error}`
        });

      if (track)
        track.stop();
    }

    this.store.setWebcamInProgress(false);
  }

  async disableWebcam() {
    console.info('disableWebcam()');

    if (!this._webcamProducer)
      return;

    this._webcamProducer.close();

    this.store.removeProducer(this._webcamProducer.id);

    try {
      await this._protoo.request('closeProducer', {producerId: this._webcamProducer.id});

      sessionStorage.setItem('webcamEnabled', 'false');
    } catch (error) {
      this.store.addNotification({
        type: 'error',
        text: `Error closing server-side webcam Producer: ${error}`
      });
    }

    this._webcamProducer = null;
  }

  async changeWebcam() {
    console.info('changeWebcam()');

    this.store.setWebcamInProgress(true);

    try {
      await this._updateWebcams();

      const array = Array.from(this._webcams.keys());
      const len = array.length;
      const deviceId =
        this._webcam.device ? this._webcam.device.deviceId : undefined;
      let idx = array.indexOf(deviceId);

      if (idx < len - 1)
        idx++;
      else
        idx = 0;

      this._webcam.device = this._webcams.get(array[idx]);

      console.info(
        'changeWebcam() | new selected webcam [device:%o]',
        this._webcam.device);

      // Reset video resolution to HD.
      this._webcam.resolution = 'hd';

      if (!this._webcam.device)
        throw new Error('no webcam devices');

      // Closing the current video track before asking for a new one (mobiles do not like
      // having both front/back cameras open at the same time).
      this._webcamProducer.track.stop();

      console.info('changeWebcam() | calling getUserMedia()');

      const stream = await navigator.mediaDevices.getUserMedia(
        {
          video:
            {
              deviceId: {exact: this._webcam.device.deviceId},
              ...VIDEO_CONSTRAINS[this._webcam.resolution]
            }
        });

      const track = stream.getVideoTracks()[0];

      await this._webcamProducer.replaceTrack({track});

      this.store.setProducerTrack(this._webcamProducer.id, track);
    } catch (error) {
      console.error('changeWebcam() | failed: %o', error);

      this.store.addNotification(
        {
          type: 'error',
          text: `Could not change webcam: ${error}`
        });
    }

    this.store.setWebcamInProgress(false);
  }

  async changeWebcamResolution() {
    console.info('changeWebcamResolution()');

    this.store.setWebcamInProgress(true);

    try {
      switch (this._webcam.resolution) {
        case 'qvga':
          this._webcam.resolution = 'vga';
          break;
        case 'vga':
          this._webcam.resolution = 'hd';
          break;
        case 'hd':
          this._webcam.resolution = 'qvga';
          break;
        default:
          this._webcam.resolution = 'hd';
      }

      console.info('changeWebcamResolution() | calling getUserMedia()');

      const stream = await navigator.mediaDevices.getUserMedia(
        {
          video:
            {
              deviceId: {exact: this._webcam.device.deviceId},
              ...VIDEO_CONSTRAINS[this._webcam.resolution]
            }
        });

      const track = stream.getVideoTracks()[0];

      await this._webcamProducer.replaceTrack({track});

      this.store.setProducerTrack(this._webcamProducer.id, track);
    } catch (error) {
      console.error('changeWebcamResolution() | failed: %o', error);

      this.store.addNotification(
        {
          type: 'error',
          text: `Could not change webcam resolution: ${error}`
        });
    }

    this.store.setWebcamInProgress(false);
  }

  async enableShare() {
    console.info('enableShare()');

    if (this._shareProducer)
      return;
    else if (this._webcamProducer)
      await this.disableWebcam();

    if (!this._mediasoupDevice.canProduce('video')) {
      console.error('enableShare() | cannot produce video');

      return;
    }

    let track;

    this.store.setShareInProgress(true);

    try {
      console.info('enableShare() | calling getUserMedia()');

      const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: false,
        video: {
          displaySurface: 'monitor',
          logicalSurface: true,
          cursor: true,
          width: {max: 1920},
          height: {max: 1080},
          frameRate: {max: 30}
        }
      });

      // May mean cancelled (in some implementations).
      if (!stream) {
        this.store.setShareInProgress(true);

        return;
      }

      track = stream.getVideoTracks()[0];

      let encodings;
      let codec;
      const codecOptions = {videoGoogleStartBitrate: 1000};

      if (this._forceVP8) {
        codec = this._mediasoupDevice.rtpCapabilities.codecs
          .find((c) => c.mimeType.toLowerCase() === 'video/vp8');

        if (!codec) {
          throw new Error('desired VP8 codec+configuration is not supported');
        }
      } else if (this._forceH264) {
        codec = this._mediasoupDevice.rtpCapabilities.codecs
          .find((c) => c.mimeType.toLowerCase() === 'video/h264');

        if (!codec) {
          throw new Error('desired H264 codec+configuration is not supported');
        }
      } else if (this._forceVP9) {
        codec = this._mediasoupDevice.rtpCapabilities.codecs
          .find((c) => c.mimeType.toLowerCase() === 'video/vp9');

        if (!codec) {
          throw new Error('desired VP9 codec+configuration is not supported');
        }
      }

      if (this._enableSharingLayers) {
        // If VP9 is the only available video codec then use SVC.
        const firstVideoCodec = this._mediasoupDevice
          .rtpCapabilities
          .codecs
          .find((c) => c.kind === 'video');

        // VP9 with SVC.
        if (
          (this._forceVP9 && codec) ||
          firstVideoCodec.mimeType.toLowerCase() === 'video/vp9'
        ) {
          encodings =
            [
              {
                maxBitrate: 5000000,
                scalabilityMode: this._sharingScalabilityMode || 'L3T3',
                dtx: true
              }
            ];
        }
        // VP8 or H264 with simulcast.
        else {
          encodings =
            [
              {
                scaleResolutionDownBy: 1,
                maxBitrate: 5000000,
                scalabilityMode: this._sharingScalabilityMode || 'L1T3',
                dtx: true
              }
            ];

          if (this._numSimulcastStreams > 1) {
            encodings.unshift(
              {
                scaleResolutionDownBy: 2,
                maxBitrate: 1000000,
                scalabilityMode: this._sharingScalabilityMode || 'L1T3',
                dtx: true
              }
            );
          }

          if (this._numSimulcastStreams > 2) {
            encodings.unshift(
              {
                scaleResolutionDownBy: 4,
                maxBitrate: 500000,
                scalabilityMode: this._sharingScalabilityMode || 'L1T3',
                dtx: true
              }
            );
          }
        }
      }

      this._shareProducer = await this._sendTransport.produce(
        {
          track,
          encodings,
          codecOptions,
          codec,
          appData:
            {
              share: true
            }
        });

      sessionStorage.setItem('shareEnabled', 'true');

      if (this._e2eKey && e2e.isSupported()) {
        e2e.setupSenderTransform(this._shareProducer.rtpSender);
      }

      this.store.addProducer({
        id: this._shareProducer.id,
        type: 'share',
        paused: this._shareProducer.paused,
        track: this._shareProducer.track,
        rtpParameters: this._shareProducer.rtpParameters,
        codec: this._shareProducer.rtpParameters.codecs[0].mimeType.split('/')[1]
      });

      this._shareProducer.on('transportclose', () => {
        this._shareProducer = null;
      });

      this._shareProducer.on('trackended', () => {
        this.store.addNotification({
          type: 'error',
          text: 'Share disconnected!'
        });

        this.disableShare()
          .catch(() => {
          });
      });
    } catch (error) {
      console.error('enableShare() | failed:%o', error);

      if (error.name !== 'NotAllowedError') {
        this.store.addNotification({
          type: 'error',
          text: `Error sharing: ${error}`
        });
      }

      if (track)
        track.stop();
    }

    this.store.setShareInProgress(false);
  }

  async disableShare() {
    console.info('disableShare()');

    if (!this._shareProducer)
      return;

    this._shareProducer.close();

    this.store.removeProducer(this._shareProducer.id);

    try {
      await this._protoo.request('closeProducer', {producerId: this._shareProducer.id});

      sessionStorage.setItem('shareEnabled', 'false');
    } catch (error) {
      this.store.addNotification({
        type: 'error',
        text: `Error closing server-side share Producer: ${error}`
      });
    }

    this._shareProducer = null;
  }

  async enableAudioOnly() {
    console.info('enableAudioOnly()');

    this.store.setAudioOnlyInProgress(true);

    await this.disableWebcam();

    for (const consumer of this._consumers.values()) {
      if (consumer.kind !== 'video')
        continue;

      await this._pauseConsumer(consumer);
    }

    this.store.setAudioOnlyState(true);

    this.store.setAudioOnlyInProgress(false);
  }

  async disableAudioOnly() {
    console.info('disableAudioOnly()');

    this.store.setAudioOnlyInProgress(true);

    if (!this._webcamProducer && this._produce && sessionStorage.getItem('webcamEnabled') !== 'false') {
      await this.enableWebcam();
    }

    for (const consumer of this._consumers.values()) {
      if (consumer.kind !== 'video')
        continue;

      await this._resumeConsumer(consumer);
    }

    this.store.setAudioOnlyState(false);

    this.store.setAudioOnlyInProgress(false);
  }

  async muteAudio() {
    console.info('muteAudio()');

    this.store.setAudioMutedState(true);
  }

  async unmuteAudio() {
    console.info('unmuteAudio()');

    this.store.setAudioMutedState(false);
  }

  async restartIce() {
    console.info('restartIce()');

    this.store.setRestartIceInProgress(true);

    try {
      if (this._sendTransport) {
        const iceParameters = await this._protoo.request(
          'restartIce',
          {transportId: this._sendTransport.id});

        await this._sendTransport.restartIce({iceParameters});
      }

      if (this._recvTransport) {
        const iceParameters = await this._protoo.request(
          'restartIce',
          {transportId: this._recvTransport.id});

        await this._recvTransport.restartIce({iceParameters});
      }

      this.store.addNotification({
        text: 'ICE restarted'
      });
    } catch (error) {
      console.error('restartIce() | failed:%o', error);

      this.store.addNotification(
        {
          type: 'error',
          text: `ICE restart failed: ${error}`
        });
    }

    this.store.setRestartIceInProgress(false);
  }

  async setMaxSendingSpatialLayer(spatialLayer) {
    console.info('setMaxSendingSpatialLayer() [spatialLayer:%s]', spatialLayer);

    try {
      if (this._webcamProducer)
        await this._webcamProducer.setMaxSpatialLayer(spatialLayer);
      else if (this._shareProducer)
        await this._shareProducer.setMaxSpatialLayer(spatialLayer);
    } catch (error) {
      console.error('setMaxSendingSpatialLayer() | failed:%o', error);

      this.store.addNotification(
        {
          type: 'error',
          text: `Error setting max sending video spatial layer: ${error}`
        });
    }
  }

  async setConsumerPreferredLayers(consumerId, spatialLayer, temporalLayer) {
    console.info('setConsumerPreferredLayers() [consumerId:%s, spatialLayer:%s, temporalLayer:%s]', consumerId, spatialLayer, temporalLayer);

    try {
      await this._protoo.request(
        'setConsumerPreferredLayers', {consumerId, spatialLayer, temporalLayer});

      this.store.setConsumerPreferredLayers(consumerId, spatialLayer, temporalLayer);
    } catch (error) {
      console.error('setConsumerPreferredLayers() | failed:%o', error);

      this.store.addNotification(
        {
          type: 'error',
          text: `Error setting Consumer preferred layers: ${error}`
        });
    }
  }

  async setConsumerPriority(consumerId, priority) {
    console.info('setConsumerPriority() [consumerId:%s, priority:%d]', consumerId, priority);

    try {
      await this._protoo.request('setConsumerPriority', {consumerId, priority});

      this.store.setConsumerPriority(consumerId, priority);
    } catch (error) {
      console.error('setConsumerPriority() | failed:%o', error);

      this.store.addNotification(
        {
          type: 'error',
          text: `Error setting Consumer priority: ${error}`
        });
    }
  }

  async requestConsumerKeyFrame(consumerId) {
    console.info('requestConsumerKeyFrame() [consumerId:%s]', consumerId);

    try {
      await this._protoo.request('requestConsumerKeyFrame', {consumerId});

      this.store.addNotification({
        text: 'Keyframe requested for video consumer'
      });
    } catch (error) {
      console.error('requestConsumerKeyFrame() | failed:%o', error);

      this.store.addNotification(
        {
          type: 'error',
          text: `Error requesting key frame for Consumer: ${error}`
        });
    }
  }

  async enableChatDataProducer() {
    console.info('enableChatDataProducer()');

    if (!this._useDataChannel)
      return;

    // NOTE: Should enable this code but it's useful for testing.
    // if (this._chatDataProducer)
    // 	return;

    try {
      // Create chat DataProducer.
      this._chatDataProducer = await this._sendTransport.produceData(
        {
          ordered: false,
          maxRetransmits: 1,
          label: 'chat',
          priority: 'medium',
          appData: {info: 'my-chat-DataProducer'}
        });

      this.store.addDataProducer({
        id: this._chatDataProducer.id,
        sctpStreamParameters: this._chatDataProducer.sctpStreamParameters,
        label: this._chatDataProducer.label,
        protocol: this._chatDataProducer.protocol
      });

      this._chatDataProducer.on('transportclose', () => {
        this._chatDataProducer = null;
      });

      this._chatDataProducer.on('open', () => {
        console.info('chat DataProducer "open" event');
      });

      this._chatDataProducer.on('close', () => {
        console.error('chat DataProducer "close" event');

        this._chatDataProducer = null;

        this.store.addNotification(
          {
            type: 'error',
            text: 'Chat DataProducer closed'
          });
      });

      this._chatDataProducer.on('error', (error) => {
        console.error('chat DataProducer "error" event:%o', error);

        this.store.addNotification(
          {
            type: 'error',
            text: `Chat DataProducer error: ${error}`
          });
      });

      this._chatDataProducer.on('bufferedamountlow', () => {
        console.info('chat DataProducer "bufferedamountlow" event');
      });
    } catch (error) {
      console.error('enableChatDataProducer() | failed:%o', error);

      this.store.addNotification(
        {
          type: 'error',
          text: `Error enabling chat DataProducer: ${error}`
        });

      throw error;
    }
  }

  async enableBotDataProducer() {
    console.info('enableBotDataProducer()');

    if (!this._useDataChannel)
      return;

    // NOTE: Should enable this code but it's useful for testing.
    // if (this._botDataProducer)
    // 	return;

    try {
      // Create chat DataProducer.
      this._botDataProducer = await this._sendTransport.produceData(
        {
          ordered: false,
          maxPacketLifeTime: 2000,
          label: 'bot',
          priority: 'medium',
          appData: {info: 'my-bot-DataProducer'}
        });

      this.store.addDataProducer({
        id: this._botDataProducer.id,
        sctpStreamParameters: this._botDataProducer.sctpStreamParameters,
        label: this._botDataProducer.label,
        protocol: this._botDataProducer.protocol
      });

      this._botDataProducer.on('transportclose', () => {
        this._botDataProducer = null;
      });

      this._botDataProducer.on('open', () => {
        console.info('bot DataProducer "open" event');
      });

      this._botDataProducer.on('close', () => {
        console.error('bot DataProducer "close" event');

        this._botDataProducer = null;

        this.store.addNotification(
          {
            type: 'error',
            text: 'Bot DataProducer closed'
          });
      });

      this._botDataProducer.on('error', (error) => {
        console.error('bot DataProducer "error" event:%o', error);

        this.store.addNotification(
          {
            type: 'error',
            text: `Bot DataProducer error: ${error}`
          });
      });

      this._botDataProducer.on('bufferedamountlow', () => {
        console.info('bot DataProducer "bufferedamountlow" event');
      });
    } catch (error) {
      console.error('enableBotDataProducer() | failed:%o', error);

      this.store.addNotification(
        {
          type: 'error',
          text: `Error enabling bot DataProducer: ${error}`
        });

      throw error;
    }
  }

  async sendChatMessage(text) {
    console.info('sendChatMessage() [text:"%s]', text);

    if (!this._chatDataProducer) {
      this.store.addNotification(
        {
          type: 'error',
          text: 'No chat DataProducer'
        });

      return;
    }

    try {
      this._chatDataProducer.send(text);
    } catch (error) {
      console.error('chat DataProducer.send() failed:%o', error);

      this.store.addNotification(
        {
          type: 'error',
          text: `chat DataProducer.send() failed: ${error}`
        });
    }
  }

  async sendBotMessage(text) {
    console.info('sendBotMessage() [text:"%s]', text);

    if (!this._botDataProducer) {
      this.store.addNotification(
        {
          type: 'error',
          text: 'No bot DataProducer'
        });

      return;
    }

    try {
      this._botDataProducer.send(text);
    } catch (error) {
      console.error('bot DataProducer.send() failed:%o', error);

      this.store.addNotification(
        {
          type: 'error',
          text: `bot DataProducer.send() failed: ${error}`
        });
    }
  }

  async changeDisplayName(displayName) {
    console.info('changeDisplayName() [displayName:"%s"]', displayName);

    sessionStorage.setItem('displayName', displayName)

    try {
      await this._protoo.request('changeDisplayName', {displayName});

      this._displayName = displayName;

      this.store.setDisplayName(displayName);

      this.store.addNotification({
        text: 'Display name changed'
      });
    } catch (error) {
      console.error('changeDisplayName() | failed: %o', error);

      this.store.addNotification(
        {
          type: 'error',
          text: `Could not change display name: ${error}`
        });

      // We need to refresh the component for it to render the previous
      // displayName again.
      this.store.setDisplayName();
    }
  }

  async getSendTransportRemoteStats() {
    console.info('getSendTransportRemoteStats()');

    if (!this._sendTransport)
      return;

    return this._protoo.request(
      'getTransportStats', {transportId: this._sendTransport.id});
  }

  async getRecvTransportRemoteStats() {
    console.info('getRecvTransportRemoteStats()');

    if (!this._recvTransport)
      return;

    return this._protoo.request(
      'getTransportStats', {transportId: this._recvTransport.id});
  }

  async getAudioRemoteStats() {
    console.info('getAudioRemoteStats()');

    if (!this._micProducer)
      return;

    return this._protoo.request(
      'getProducerStats', {producerId: this._micProducer.id});
  }

  async getVideoRemoteStats() {
    console.info('getVideoRemoteStats()');

    const producer = this._webcamProducer || this._shareProducer;

    if (!producer)
      return;

    return this._protoo.request(
      'getProducerStats', {producerId: producer.id});
  }

  async getConsumerRemoteStats(consumerId) {
    console.info('getConsumerRemoteStats()');

    const consumer = this._consumers.get(consumerId);

    if (!consumer)
      return;

    return this._protoo.request('getConsumerStats', {consumerId});
  }

  async getChatDataProducerRemoteStats() {
    console.info('getChatDataProducerRemoteStats()');

    const dataProducer = this._chatDataProducer;

    if (!dataProducer)
      return;

    return this._protoo.request(
      'getDataProducerStats', {dataProducerId: dataProducer.id});
  }

  async getBotDataProducerRemoteStats() {
    console.info('getBotDataProducerRemoteStats()');

    const dataProducer = this._botDataProducer;

    if (!dataProducer)
      return;

    return this._protoo.request(
      'getDataProducerStats', {dataProducerId: dataProducer.id});
  }

  async getDataConsumerRemoteStats(dataConsumerId) {
    console.info('getDataConsumerRemoteStats()');

    const dataConsumer = this._dataConsumers.get(dataConsumerId);

    if (!dataConsumer)
      return;

    return this._protoo.request('getDataConsumerStats', {dataConsumerId});
  }

  async getSendTransportLocalStats() {
    console.info('getSendTransportLocalStats()');

    if (!this._sendTransport)
      return;

    return this._sendTransport.getStats();
  }

  async getRecvTransportLocalStats() {
    console.info('getRecvTransportLocalStats()');

    if (!this._recvTransport)
      return;

    return this._recvTransport.getStats();
  }

  async getAudioLocalStats() {
    console.info('getAudioLocalStats()');

    if (!this._micProducer)
      return;

    return this._micProducer.getStats();
  }

  async getVideoLocalStats() {
    console.info('getVideoLocalStats()');

    const producer = this._webcamProducer || this._shareProducer;

    if (!producer)
      return;

    return producer.getStats();
  }

  async getConsumerLocalStats(consumerId) {
    const consumer = this._consumers.get(consumerId);

    if (!consumer)
      return;

    return consumer.getStats();
  }

  async applyNetworkThrottle({uplink, downlink, rtt, secret, packetLoss}) {
    console.info(
      'applyNetworkThrottle() [uplink:%s, downlink:%s, rtt:%s, packetLoss:%s]',
      uplink, downlink, rtt, packetLoss);

    try {
      await this._protoo.request(
        'applyNetworkThrottle',
        {secret, uplink, downlink, rtt, packetLoss});
    } catch (error) {
      console.error('applyNetworkThrottle() | failed:%o', error);

      this.store.addNotification(
        {
          type: 'error',
          text: `Error applying network throttle: ${error}`
        });
    }
  }

  async resetNetworkThrottle({silent = false, secret}) {
    console.info('resetNetworkThrottle()');

    try {
      await this._protoo.request('resetNetworkThrottle', {secret});
    } catch (error) {
      if (!silent) {
        console.error('resetNetworkThrottle() | failed:%o', error);

        this.store.addNotification(
          {
            type: 'error',
            text: `Error resetting network throttle: ${error}`
          });
      }
    }
  }

  async _joinRoom() {
    console.info('_joinRoom()');

    try {
      this._mediasoupDevice = new mediasoupClient.Device({
        handlerName: this._handlerName
      });

      this.store.setRoomMediasoupClientHandler(this._mediasoupDevice.handlerName);

      const routerRtpCapabilities = await this._protoo.request('getRouterRtpCapabilities');

      await this._mediasoupDevice.load({routerRtpCapabilities});

      // NOTE: Stuff to play remote audios due to browsers' new autoplay policy.
      //
      // Just get access to the mic and DO NOT close the mic track for a while.
      // Super hack!
      {
        const stream = await navigator.mediaDevices.getUserMedia({audio: true});
        const audioTrack = stream.getAudioTracks()[0];

        audioTrack.enabled = false;

        setTimeout(() => audioTrack.stop(), 120000);
      }
      // Create mediasoup Transport for sending (unless we don't want to produce).
      if (this._produce) {
        const transportInfo = await this._protoo.request('createWebRtcTransport', {
          forceTcp: this._forceTcp,
          producing: true,
          consuming: false,
          sctpCapabilities: this._useDataChannel
            ? this._mediasoupDevice.sctpCapabilities
            : undefined
        });

        const {id, iceParameters, iceCandidates, dtlsParameters, sctpParameters} = transportInfo;

        this._sendTransport = this._mediasoupDevice.createSendTransport({
          id,
          iceParameters,
          iceCandidates,
          dtlsParameters: {
            ...dtlsParameters,
            // Remote DTLS role. We know it's always 'auto' by default so, if
            // we want, we can force local WebRTC transport to be 'client' by
            // indicating 'server' here and vice-versa.
            role: 'auto'
          },
          sctpParameters,
          iceServers: [],
          proprietaryConstraints: PC_PROPRIETARY_CONSTRAINTS,
          additionalSettings: {encodedInsertableStreams: this._e2eKey && e2e.isSupported()}
        });

        this._sendTransport.on('connect', ({iceParameters, dtlsParameters}, callback, errback) => {
          this._protoo.request('connectWebRtcTransport', {
            transportId: this._sendTransport.id,
            iceParameters,
            dtlsParameters
          })
            .then(callback)
            .catch(errback);
        });

        this._sendTransport.on('produce', async ({kind, rtpParameters, appData}, callback, errback) => {
          try {
            // eslint-disable-next-line no-shadow
            const {id} = await this._protoo.request('produce', {
              transportId: this._sendTransport.id,
              kind,
              rtpParameters,
              appData
            });

            callback({id});
          } catch (error) {
            errback(error);
          }
        });

        this._sendTransport.on('producedata', async (
          {
            sctpStreamParameters,
            label,
            protocol,
            appData
          },
          callback,
          errback
        ) => {
          console.info('"producedata" event: [sctpStreamParameters:%o, appData:%o]', sctpStreamParameters, appData);

          try {
            // eslint-disable-next-line no-shadow
            const {id} = await this._protoo.request('produceData', {
              transportId: this._sendTransport.id,
              sctpStreamParameters,
              label,
              protocol,
              appData
            });

            callback({id});
          } catch (error) {
            errback(error);
          }
        });
      }

      // Create mediasoup Transport for receiving (unless we don't want to consume).
      if (this._consume) {
        const transportInfo = await this._protoo.request(
          'createWebRtcTransport',
          {
            forceTcp: this._forceTcp,
            producing: false,
            consuming: true,
            sctpCapabilities: this._useDataChannel
              ? this._mediasoupDevice.sctpCapabilities
              : undefined
          });

        const {
          id,
          iceParameters,
          iceCandidates,
          dtlsParameters,
          sctpParameters
        } = transportInfo;

        this._recvTransport = this._mediasoupDevice.createRecvTransport({
          id,
          iceParameters,
          iceCandidates,
          dtlsParameters: {
            ...dtlsParameters,
            // Remote DTLS role. We know it's always 'auto' by default so, if
            // we want, we can force local WebRTC transport to be 'client' by
            // indicating 'server' here and vice-versa.
            role: 'auto'
          },
          sctpParameters,
          iceServers: [],
          additionalSettings: {encodedInsertableStreams: this._e2eKey && e2e.isSupported()}
        });

        this._recvTransport.on('connect', ({iceParameters, dtlsParameters}, callback, errback) => {
          this._protoo.request(
            'connectWebRtcTransport',
            {
              transportId: this._recvTransport.id,
              iceParameters,
              dtlsParameters
            })
            .then(callback)
            .catch(errback);
        });
      }

      // Join now into the room.
      // NOTE: Don't send our RTP capabilities if we don't want to consume.
      const {peers} = await this._protoo.request('join', {
        displayName: this._displayName,
        device: this._device,
        rtpCapabilities: this._consume ? this._mediasoupDevice.rtpCapabilities : undefined,
        sctpCapabilities: this._useDataChannel && this._consume ? this._mediasoupDevice.sctpCapabilities : undefined
      });

      this.store.setRoomState('connected');

      // Clean all the existing notifcations.
      this.store.removeAllNotifications();

      this.store.addNotification({
        text: 'You are in the room!',
        timeout: 3000
      });

      for (const peer of peers) {
        this.store.addPeer({...peer, consumers: [], dataConsumers: []});
      }

      // Enable mic/webcam.
      if (this._produce) {
        // Set our media capabilities.
        this.store.setMediaCapabilities({
          canSendMic: this._mediasoupDevice.canProduce('audio'),
          canSendWebcam: this._mediasoupDevice.canProduce('video')
        });

        if (sessionStorage.getItem('micEnabled') === 'true') {
          await this.enableMic();
        }

        if (sessionStorage.getItem('webcamEnabled') === 'true' || this._externalVideo) {
          await this.enableWebcam();
        }

        this._sendTransport.on('connectionstatechange', (connectionState) => {
          if (connectionState === 'connected') {
            this.enableChatDataProducer();
            this.enableBotDataProducer();
          }
        });
      }

      // NOTE: For testing.
      // if (window.SHOW_INFO) {
      //     const {me} = store.getState();
      //
      //     this.store.setRoomStatsPeerId(me.id);
      // }
    } catch (error) {
      console.error('_joinRoom() failed:%o', error);

      this.store.addNotification({
        type: 'error',
        text: `Could not join the room: ${error}`
      });

      this.close();
    }
  }

  async _updateWebcams() {
    console.info('_updateWebcams()');

    // Reset the list.
    this._webcams = new Map();

    console.info('_updateWebcams() | calling enumerateDevices()');

    const devices = await navigator.mediaDevices.enumerateDevices();

    for (const device of devices) {
      if (device.kind !== 'videoinput')
        continue;

      this._webcams.set(device.deviceId, device);
    }

    const array = Array.from(this._webcams.values());
    const len = array.length;
    const currentWebcamId =
      this._webcam.device ? this._webcam.device.deviceId : undefined;

    console.info('_updateWebcams() [webcams:%o]', array);

    if (len === 0) {
      this._webcam.device = null;
    } else if (!this._webcams.has(currentWebcamId)) {
      this._webcam.device = array[0];
    }

    this.store.setCanChangeWebcam(this._webcams.size > 1);
  }

  _getWebcamType(device) {
    if (/(back|rear)/i.test(device.label)) {
      console.info('_getWebcamType() | it seems to be a back camera');

      return 'back';
    } else {
      console.info('_getWebcamType() | it seems to be a front camera');

      return 'front';
    }
  }

  async _pauseConsumer(consumer) {
    if (consumer.paused)
      return;

    try {
      await this._protoo.request('pauseConsumer', {consumerId: consumer.id});

      consumer.pause();

      this.store.setConsumerPaused(consumer.id, 'local');
    } catch (error) {
      console.error('_pauseConsumer() | failed:%o', error);

      this.store.addNotification(
        {
          type: 'error',
          text: `Error pausing Consumer: ${error}`
        });
    }
  }

  async _resumeConsumer(consumer) {
    if (!consumer.paused)
      return;

    try {
      await this._protoo.request('resumeConsumer', {consumerId: consumer.id});

      consumer.resume();

      this.store.setConsumerResumed(consumer.id, 'local');
    } catch (error) {
      console.error('_resumeConsumer() | failed:%o', error);

      this.store.addNotification({
        type: 'error',
        text: `Error resuming Consumer: ${error}`
      });
    }
  }

  async _getExternalVideoStream() {
    if (this._externalVideoStream)
      return this._externalVideoStream;

    if (this._externalVideo.readyState < 3) {
      await new Promise((resolve) => (
        this._externalVideo.addEventListener('canplay', resolve)
      ));
    }

    if (this._externalVideo.captureStream)
      this._externalVideoStream = this._externalVideo.captureStream();
    else if (this._externalVideo.mozCaptureStream)
      this._externalVideoStream = this._externalVideo.mozCaptureStream();
    else
      throw new Error('video.captureStream() not supported');

    return this._externalVideoStream;
  }
}

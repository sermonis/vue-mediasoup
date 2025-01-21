import {defineStore} from 'pinia';
import {useMeStore} from "@/stores/me.js";
import {useRoomStore} from "@/stores/room.js";
import {useProducersStore} from "@/stores/producers.js";
import {useDataProducersStore} from "@/stores/data-producers.js";
import {useConsumersStore} from "@/stores/consumers.js";
import {useDataConsumersStore} from "@/stores/data-consumers.js";
import {usePeersStore} from "@/stores/peers.js";
import {useNotificationsStore} from "@/stores/notifications.js";

export const useStore = defineStore('store', () => {
  const meStore = useMeStore();
  const roomStore = useRoomStore();
  const producersStore = useProducersStore();
  const dataProducersStore = useDataProducersStore();
  const consumersStore = useConsumersStore();
  const dataConsumersStore = useDataConsumersStore();
  const peersStore = usePeersStore();
  const notificationsStore = useNotificationsStore();

  const me = meStore.me;

  const room = roomStore.room;

  const producers = producersStore.producers;

  const dataProducers = dataProducersStore.dataProducers;

  const consumers = consumersStore.consumers;

  const dataConsumers = dataConsumersStore.dataConsumers;

  const peers = peersStore.peers;

  // me.js
  const setRoomState = (roomState) => {
    meStore.setRoomState(roomState);
    roomStore.setRoomState(roomState);
    producersStore.setRoomState(roomState);
    dataProducersStore.setRoomState(roomState);
    consumersStore.setRoomState(roomState);
    dataConsumersStore.setRoomState(roomState);
    peersStore.setRoomState(roomState);
  }

  const setMe = (data) => {
    meStore.setMe(data)
  }

  const setMediaCapabilities = (data) => {
    meStore.setMediaCapabilities(data);
  }

  const setCanChangeWebcam = (canChangeWebcam) => {
    meStore.setCanChangeWebcam(canChangeWebcam);
  }

  const setWebcamInProgress = (flag) => {
    meStore.setWebcamInProgress(flag);
  }

  const setShareInProgress = (flag) => {
    meStore.setShareInProgress(flag);
  }

  const setDisplayName = (displayName) => {
    meStore.setDisplayName(displayName);
  }

  const setAudioOnlyState = (enabled) => {
    meStore.setAudioOnlyState(enabled);
  }

  const setAudioOnlyInProgress = (flag) => {
    meStore.setAudioOnlyInProgress(flag);
  }

  const setAudioMutedState = (enabled) => {
    meStore.setAudioMutedState(enabled);
  }

  const setRestartIceInProgress = (flag) => {
   meStore.setRestartIceInProgress(flag);
  }

  // room.js
  const setRoomUrl = (url) => {
    roomStore.setRoomUrl(url);
  }

  const setRoomMediasoupClientHandler = (mediasoupClientHandler) => {
    roomStore.setRoomMediasoupClientHandler(mediasoupClientHandler);
  }

  const setMediasoupVersion = (version) => {
    roomStore.setMediasoupVersion(version);
  }

  const setMediasoupClientVersion = (version) => {
    roomStore.setMediasoupClientVersion(version);
  }

  const setRoomActiveSpeaker = (peerId) => {
    roomStore.setRoomActiveSpeaker(peerId);
  }

  const setRoomStatsPeerId = (peerId) => {
    roomStore.setRoomStatsPeerId(peerId);
  }

  const setFaceDetection = (flag) => {
    roomStore.setFaceDetection(flag);
  }

  const removePeer = (peerId) => {
    roomStore.removePeer(peerId);
    peersStore.removePeer(peerId);
  }

  // producers.js
  const addProducer = (producer) => {
    producersStore.addProducer(producer);
  }

  const removeProducer = (producerId) => {
    producersStore.removeProducer(producerId);
  }

  const setProducerPaused = (producerId) => {
    producersStore.setProducerPaused(producerId);
  }

  const setProducerResumed = (producerId) => {
    producersStore.setProducerResumed(producerId);
  }

  const setProducerTrack = (producerId, track) => {
    producersStore.setProducerTrack(producerId, track);
  }

  const setProducerScore = (producerId, score) => {
    producersStore.setProducerScore(producerId, score);
  }

  // data-producers.js
  const addDataProducer = (dataProducer) => {
    dataProducersStore.addDataProducer(dataProducer);
  }

  const removeDataProducer = (dataProducerId) => {
    dataProducersStore.removeDataProducer(dataProducerId);
  }

  // consumers.js
  const addConsumer = (consumer, peerId) => {
    consumersStore.addConsumer(consumer);
    peersStore.addConsumer(consumer, peerId);
  }

  const removeConsumer = (consumerId, peerId) => {
    consumersStore.removeConsumer(consumerId);
    peersStore.removeConsumer(consumerId, peerId)
  }

  const setConsumerPaused = (consumerId, originator) => {
    consumersStore.setConsumerPaused(consumerId, originator);
  }

  const setConsumerResumed = (consumerId, originator) => {
    consumersStore.setConsumerResumed(consumerId, originator);
  }

  const setConsumerCurrentLayers = (consumerId, spatialLayer, temporalLayer) => {
    consumersStore.setConsumerCurrentLayers(consumerId, spatialLayer, temporalLayer);
  }

  const setConsumerPreferredLayers = (consumerId, spatialLayer, temporalLayer) => {
    consumersStore.setConsumerPreferredLayers(consumerId, spatialLayer, temporalLayer);
  }

  const setConsumerPriority = (consumerId, priority) => {
    consumersStore.setConsumerPriority(consumerId, priority);
  }

  const setConsumerTrack = (consumerId, track) => {
    consumersStore.setConsumerTrack(consumerId, track);
  }

  const setConsumerScore = (consumerId, score) => {
    consumersStore.setConsumerScore(consumerId, score);
  }

  // data-consumers.js
  const addDataConsumer = (dataConsumer, peerId) => {
    dataConsumersStore.addDataConsumer(dataConsumer);
    peersStore.addDataConsumer(dataConsumer, peerId);
  }

  const removeDataConsumer = (dataConsumerId, peerId) => {
    dataConsumersStore.removeDataConsumer(dataConsumerId);
    peersStore.removeDataConsumer(dataConsumerId, peerId)
  }

  // peers.js
  const addPeer = (peer) => {
    peersStore.addPeer(peer);
  }

  const setPeerDisplayName = (displayName, peerId) => {
    peersStore.setPeerDisplayName(displayName, peerId);
  }

  // notifications.js
  const addNotification = (msg) => {
    notificationsStore.addNotification(msg);
  }

  const removeNotification = (notificationId) => {
    notificationsStore.removeNotification(notificationId);
  }

  const removeAllNotifications = () => {
    notificationsStore.removeAllNotifications();
  }

  return {
    meStore,
    roomStore,
    producersStore,
    dataProducersStore,
    consumersStore,
    dataConsumersStore,
    peersStore,

    // me
    setRoomState,
    setMe,
    setMediaCapabilities,
    setCanChangeWebcam,
    setWebcamInProgress,
    setShareInProgress,
    setDisplayName,
    setAudioOnlyState,
    setAudioOnlyInProgress,
    setAudioMutedState,
    setRestartIceInProgress,

    // room
    setRoomUrl,
    setRoomMediasoupClientHandler,
    setMediasoupVersion,
    setMediasoupClientVersion,
    setRoomActiveSpeaker,
    setRoomStatsPeerId,
    setFaceDetection,
    removePeer,

    // producer
    addProducer,
    removeProducer,
    setProducerPaused,
    setProducerResumed,
    setProducerTrack,
    setProducerScore,

    // data-producers
    addDataProducer,
    removeDataProducer,

    // consumers
    addConsumer,
    removeConsumer,
    setConsumerPaused,
    setConsumerResumed,
    setConsumerCurrentLayers,
    setConsumerPreferredLayers,
    setConsumerPriority,
    setConsumerTrack,
    setConsumerScore,

    // data-consumers
    addDataConsumer,
    removeDataConsumer,

    // peers
    addPeer,
    setPeerDisplayName,

    //
    addNotification,
    removeNotification,
    removeAllNotifications,
  }
});

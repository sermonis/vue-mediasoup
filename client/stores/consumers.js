import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useConsumersStore = defineStore('consumersStore', () => {
  const consumers = ref({});

  const setRoomState = (roomState) => {
    if (roomState === 'closed') {
      consumers.value = {};
    }
  }

  const addConsumer = (consumer) => {
    consumers.value = {...consumers.value, [consumer.id]: consumer};
  }

  const removeConsumer = (consumerId) => {
    delete consumers.value[consumerId];
  }

  const setConsumerPaused = (consumerId, originator) => {
    let consumer;

    if (originator === 'local') {
      consumer = {...consumers.value[consumerId], locallyPaused: true};
    }
    else {
      consumer = { ...consumers.value[consumerId], remotelyPaused: true };
    }

    consumers.value = {...consumers.value, [consumerId]: consumer};
  }

  const setConsumerResumed = (consumerId, originator) => {
    let consumer;

    if (originator === 'local') {
      consumer = {...consumers.value[consumerId], locallyPaused: false};
    }
    else {
      consumer = { ...consumers.value[consumerId], remotelyPaused: false };
    }

    consumers.value = {...consumers.value, [consumerId]: consumer};
  }

  const setConsumerCurrentLayers = (consumerId, spatialLayer, temporalLayer) => {
    const consumer = {...consumers.value[consumerId], currentSpatialLayer: spatialLayer, currentTemporalLayer: temporalLayer};
    consumers.value = {...consumers.value, [consumerId]: consumer};
  }

  const setConsumerPreferredLayers = (consumerId, spatialLayer, temporalLayer) => {
    const consumer = {...consumers.value[consumerId], preferredSpatialLayer: spatialLayer, preferredTemporalLayer: temporalLayer};
    consumers.value = {...consumers.value, [consumerId]: consumer};
  }

  const setConsumerPriority = (consumerId, priority) => {
    const consumer = {...consumers.value[consumerId], priority};
    consumers.value = {...consumers.value, [consumerId]: consumer};
  }

  const setConsumerTrack = (consumerId, track) => {
    const consumer = {...consumers.value[consumerId], track};
    consumers.value = {...consumers.value, [consumerId]: consumer};
  }

  const setConsumerScore = (consumerId, score) => {
    const consumer = {...consumers.value[consumerId], score};
    consumers.value = {...consumers.value, [consumerId]: consumer};
  }

  return {
    consumers,
    setRoomState,
    addConsumer,
    removeConsumer,
    setConsumerPaused,
    setConsumerResumed,
    setConsumerCurrentLayers,
    setConsumerPreferredLayers,
    setConsumerPriority,
    setConsumerTrack,
    setConsumerScore,
  }
});

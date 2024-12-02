import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useProducersStore = defineStore('producersStore', () => {
  const producers = ref({});

  const setRoomState = (roomState) => {
    if (roomState === 'closed') {
      producers.value = {};
    }
  }

  const addProducer = (producer) => {
    producers.value = {...producers.value, [producer.id]: producer};
  }

  const removeProducer = (producerId) => {
    delete producers.value[producerId];
  }

  const setProducerPaused = (producerId) => {
    const producer = {...producers.value[producerId], paused: true}

    producers.value = {...producers.value, [producer.id]: producer};
  }

  const setProducerResumed = (producerId) => {
    const producer = {...producers.value[producerId], paused: false}

    producers.value = {...producers.value, [producer.id]: producer};
  }

  const setProducerTrack = (producerId, track) => {
    const producer = {...producers.value[producerId], track}

    producers.value = {...producers.value, [producer.id]: producer};
  }

  const setProducerScore = (producerId, score) => {
    const producer = {...producers.value[producerId], score}

    producers.value = {...producers.value, [producer.id]: producer};
  }

  return {
    producers,
    setRoomState,
    addProducer,
    removeProducer,
    setProducerPaused,
    setProducerResumed,
    setProducerTrack,
    setProducerScore,
  }
});

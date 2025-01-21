import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useDataProducersStore = defineStore('dataProducersStore', () => {
  const dataProducers = ref({});

  const setRoomState = (roomState) => {
    if (roomState === 'closed') {
      dataProducers.value = {};
    }
  }

  const addDataProducer = (dataProducer) => {
    dataProducers.value = {...dataProducers.value, [dataProducer.id]: dataProducer};
  }

  const removeDataProducer = (dataProducerId) => {
    delete dataProducers.value[dataProducerId];
  }

  return {
    dataProducers,
    setRoomState,
    addDataProducer,
    removeDataProducer,
  }
});

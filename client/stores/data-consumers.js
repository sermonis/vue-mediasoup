import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useDataConsumersStore = defineStore('dataConsumersStore', () => {

  const dataConsumers = ref({});

  const setRoomState = (roomState) => {
    if (roomState === 'closed') {
      dataConsumers.value = {};
    }
  }

  const addDataConsumer = (dataConsumer) => {
    dataConsumers.value = {...dataConsumers.value, [dataConsumer.id]: dataConsumer};
  }

  const removeDataConsumer = (dataConsumerId) => {
    delete dataConsumers.value[dataConsumerId];
  }

  return {
    dataConsumers,
    setRoomState,
    addDataConsumer,
    removeDataConsumer,
  }
});

import { ref } from 'vue'
import { defineStore } from 'pinia'

export const usePeersStore = defineStore('peersStore', () => {
  const peers = ref({});

  const setRoomState = (roomState) => {
    if (roomState === 'closed') {
      peers.value = {};
    }
  }

  const addPeer = (peer) => {
    peers.value = {...peers.value, [peer.id]: peer};
  }

  const removePeer = (peerId) => {
    delete peers.value[peerId];
  }

  const setPeerDisplayName = (displayName, peerId) => {
    const peer = peers.value[peerId];

    if (peer) {
      peers.value = { ...peers.value, [peer.id]: { ...peer, displayName } }
    }
  }

  const addConsumer = (consumer, peerId) => {
    const peer = peers.value[peerId];

    if (peer) {
      const consumers = [...peer.consumers, consumer.id];
      peers.value = { ...peers.value, [peer.id]: {...peer, consumers} }
    }
  }

  const removeConsumer = (consumerId, peerId) => {
    const peer = peers.value[peerId];

    if (peer) {
      const idx = peer.consumers.indexOf(consumerId);

      if (idx !== -1) {
        const consumers = peer.consumers.slice();

        consumers.splice(idx, 1);

        peers.value = { ...peers.value, [peer.id]: { ...peer, consumers: consumers } };
      }
    }
  }

  const addDataConsumer = (dataConsumer, peerId) => {
    if (peerId) {
      const peer = peers[peerId];
      if (peer) {
        const dataConsumers = [...peer.dataConsumers, dataConsumer.id];
        peers.value = {...peers.value, [peer.id]: { ...peer, dataConsumers: dataConsumers }}
      }
    }
  }

  const removeDataConsumer = (dataConsumerId, peerId) => {
    if (peerId) {
      const peer = peers[peerId];
      if (peer) {
        const idx = peer.dataConsumers.indexOf(dataConsumerId);
        if (idx !== -1) {
          const dataConsumers = peer.dataConsumers.slice();

          dataConsumers.splice(idx, 1);

          peers.value = { ...peers.value, [peer.id]: { ...peer, dataConsumers: dataConsumers } };
        }
      }
    }
  }

  return {
    peers,
    setRoomState,
    addPeer,
    removePeer,
    setPeerDisplayName,
    addConsumer,
    removeConsumer,
    addDataConsumer,
    removeDataConsumer,
  }
});

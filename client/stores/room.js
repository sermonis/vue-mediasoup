import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useRoomStore = defineStore('roomStore', () => {
  const room = ref({
    url: null,
    state: 'new', // new/connecting/connected/disconnected/closed;
    mediasoupVersion: null,
    mediasoupClientVersion: null,
    mediasoupClientHandler: undefined,
    activeSpeakerId: null,
    statsPeerId: null,
    faceDetection: false,
  });

  const setRoomUrl = (url) => {
    room.value = {...room.value, url}
  }

  const setRoomState = (roomState) => {
    if (roomState === 'connected') {
      room.value = {...room.value, state: roomState }
    }
    else {
      room.value = {...room.value, state: roomState, activeSpeakerId: null, statsPeerId: null}
    }
  }

  const setRoomMediasoupClientHandler = (mediasoupClientHandler) => {
    room.value = {...room.value, mediasoupClientHandler}
  }

  const setMediasoupVersion = (version) => {
    room.value = {...room.value, mediasoupVersion: version}
  }

  const setMediasoupClientVersion = (version) => {
    room.value = {...room.value, mediasoupClientVersion: version}
  }

  const setRoomActiveSpeaker = (peerId) => {
    room.value = {...room.value, activeSpeakerId: peerId}
  }

  const setRoomStatsPeerId = (peerId) => {
    if (room.value.statsPeerId === peerId) {
      room.value = {...room.value, statsPeerId: null}
    }
    else {
      room.value = {...room.value, statsPeerId: peerId}
    }
  }

  const setFaceDetection = (flag) => {
    room.value = {...room.value, faceDetection: flag}
  }

  const removePeer = (peerId) => {
    if (peerId && peerId === room.value.activeSpeakerId) {
      room.value = {...room.value, activeSpeakerId: null}
    }

    if (peerId && peerId === room.value.statsPeerId) {
      room.value = {...room.value, statsPeerId: null}
    }
  }

  return {
    room,
    setRoomUrl,
    setRoomState,
    setRoomMediasoupClientHandler,
    setMediasoupVersion,
    setMediasoupClientVersion,
    setRoomActiveSpeaker,
    setRoomStatsPeerId,
    setFaceDetection,
    removePeer,
  }
});

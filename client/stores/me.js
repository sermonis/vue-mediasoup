import {ref} from 'vue'
import {defineStore} from 'pinia'

export const useMeStore = defineStore('meStore', () => {
  const me = ref({
    id: null,
    displayName: null,
    displayNameSet: false,
    device: null,
    canSendMic: false,
    canSendWebcam: false,
    canChangeWebcam: false,
    webcamInProgress: false,
    shareInProgress: false,
    audioOnly: false,
    audioOnlyInProgress: false,
    audioMuted: false,
    restartIceInProgress: false,
  });

  const setRoomState = (roomState) => {
    if (roomState === 'closed') {
      me.value = {
        ...me.value,
        webcamInProgress: false,
        shareInProgress: false,
        audioOnly: false,
        audioOnlyInProgress: false,
        restartIceInProgress: false
      }
    }
  }

  const setMe = ({peerId, displayName, displayNameSet, device}) => {
    me.value = {...me.value, id: peerId, displayName, displayNameSet, device}
  }

  const setMediaCapabilities = ({canSendMic, canSendWebcam}) => {
    me.value = {...me.value, canSendMic, canSendWebcam}
  }

  const setCanChangeWebcam = (canChangeWebcam) => {
    me.value = {...me.value, canChangeWebcam}
  }

  const setWebcamInProgress = (flag) => {
    me.value = {...me.value, webcamInProgress: flag}
  }

  const setShareInProgress = (flag) => {
    me.value = {...me.value, shareInProgress: flag}
  }

  const setDisplayName = (displayName) => {
    me.value = {...me.value, displayName, displayNameSet: true}
  }

  const setAudioOnlyState = (enabled) => {
    me.value = {...me.value, audioOnly: enabled}
  }

  const setAudioOnlyInProgress = (flag) => {
    me.value = {...me.value, audioOnlyInProgress: flag}
  }

  const setAudioMutedState = (enabled) => {
    me.value = {...me.value, audioMuted: enabled}
  }

  const setRestartIceInProgress = (flag) => {
    me.value = {...me.value, restartIceInProgress: flag}
  }

  return {
    me,
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
  }
});

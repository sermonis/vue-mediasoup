<template>
  <div class="max-w-7xl mx-auto px-2 md:px-4">
    <div class="header">
      <div class="state">
        <span :class="store.roomStore.room.state">
          <span class="ping"></span>
          <span class="dot"></span>
        </span>
        <span class="txt">{{ store.roomStore.room.state }}</span>
      </div>
      <div class="title">xxx-metting</div>
      <button type="button" class="qrcode">
        <img src="@/assets/icon_qrcode_white.svg" alt="qrcode">
      </button>
    </div>
    <div class="videos">
      <div class="video-main">
        <Me />
      </div>
      <div class="video-other">
        <template v-for="peer in store.peersStore.peers">
          <Peer :peer="peer"/>
        </template>
      </div>
    </div>
    <div class="footer">
      <button type="button" v-if="store.roomStore.room.state === 'connected'" @click="actionMic">
        <img :src="micSvg" alt="mic-svg">
      </button>
      <button type="button"  v-if="store.roomStore.room.state === 'connected'" @click="actionWebcam">
        <img :src="webcamSvg" alt="video-svg">
      </button>
      <button type="button" v-if="store.roomStore.room.state === 'connected'" @click="actionShare">
        <img :src="shareSvg" alt="share-svg">
      </button>
      <button type="button" class="exit"  v-if="store.roomStore.room.state === 'connected'">
        <img src="@/assets/icon_exit_white.svg" alt="exit-svg">
      </button>
    </div>
  </div>
</template>

<script setup>
import {computed, onMounted, ref} from 'vue';
import { useStore } from '@/stores/index.js';
import RoomClient from "@/utils/RoomClient.js";
import Me from "@/components/Me.vue";
import Peer from "@/components/Peer.vue";
import micOn from "@/assets/icon_mic_black_on.svg";
import micOff from "@/assets/icon_mic_white_off.svg";
import webcamOn from "@/assets/icon_video_black_on.svg";
import webcamOff from "@/assets/icon_video_white_off.svg";
import shareOn from "@/assets/icon_share_black_on.svg";
import shareOff from "@/assets/icon_share_white_off.svg";

const store = useStore();

const url = new URL(window.location);
const peerId = Math.random().toString(36).substring(2, 10);
let roomId = url.searchParams.get('roomId');
let displayName = url.searchParams.get('displayName') || (JSON.parse(localStorage.getItem('user')) || {}).displayName;
const handlerName = url.searchParams.get('handlerName') || url.searchParams.get('handler');
const forceTcp = url.searchParams.get('forceTcp') === 'true';
const produce = url.searchParams.get('produce') !== 'false';
const consume = url.searchParams.get('consume') !== 'false';
const datachannel = url.searchParams.get('datachannel') !== 'false';
const forceVP8 = url.searchParams.get('forceVP8') === 'true';
const forceH264 = url.searchParams.get('forceH264') === 'true';
const forceVP9 = url.searchParams.get('forceVP9') === 'true';
const enableWebcamLayers = url.searchParams.get('enableWebcamLayers') !== 'false';
const enableSharingLayers = url.searchParams.get('enableSharingLayers') !== 'false';
const webcamScalabilityMode = url.searchParams.get('webcamScalabilityMode');
const sharingScalabilityMode = url.searchParams.get('sharingScalabilityMode');
const numSimulcastStreams = url.searchParams.get('numSimulcastStreams') ? Number(url.searchParams.get('numSimulcastStreams')) : 3;
const info = url.searchParams.get('info') === 'true';
const faceDetection = url.searchParams.get('faceDetection') === 'true';
const externalVideo = url.searchParams.get('externalVideo') === 'true';
const throttleSecret = url.searchParams.get('throttleSecret');
const e2eKey = url.searchParams.get('e2eKey');
const consumerReplicas = url.searchParams.get('consumerReplicas');

let roomClient = null;

const micEnabled = ref(sessionStorage.getItem('micEnabled') === 'true');
const webcamEnabled = ref(sessionStorage.getItem('webcamEnabled') === 'true');
const shareEnabled = ref(sessionStorage.getItem('shareEnabled') === 'true');

const micSvg = computed(() => micEnabled.value ? micOn : micOff);
const webcamSvg = computed(() => webcamEnabled.value ? webcamOn : webcamOff);
const shareSvg = computed(() => shareEnabled.value ? shareOn : shareOff);

const actionMic = () => {
  if (micEnabled.value) {
    roomClient.disableMic();
  }
  else {
    roomClient.enableMic();
  }
  micEnabled.value = !micEnabled.value;
}

const actionWebcam = () => {
  if (webcamEnabled.value) {
    roomClient.disableWebcam();
  }
  else {
    roomClient.enableWebcam();
  }
  webcamEnabled.value = !webcamEnabled.value;
}

const actionShare = () => {
  if (shareEnabled.value) {
    roomClient.disableShare();
  }
  else {
    roomClient.enableShare();
    webcamEnabled.value = false;
  }
  shareEnabled.value = !shareEnabled.value;
}

onMounted(() => {
  if (!roomId) {
    roomId = Math.random().toString(36).substring(2, 10);

    url.searchParams.set('roomId', roomId);

    window.history.pushState({}, '', url.toString());
  }

  if (!displayName) {
    displayName = Math.random().toString(36).substring(2, 10);

    url.searchParams.set('displayName', displayName);

    window.history.pushState({}, '', url.toString());
  }

  const device = {
    flag: 'edge',
    name: 'devicename',
    version: '25.424.23455'
  };

  store.setRoomUrl(window.location.href);

  store.setFaceDetection(faceDetection);

  store.setMe({peerId, displayName, peerDisplayNameSet: true, device});

  roomClient = new RoomClient({
    roomId,
    peerId,
    displayName,
    device,
    handlerName,
    forceTcp,
    produce,
    consume,
    datachannel,
    forceVP8,
    forceH264,
    forceVP9,
    enableWebcamLayers,
    enableSharingLayers,
    webcamScalabilityMode,
    sharingScalabilityMode,
    numSimulcastStreams,
    externalVideo,
    e2eKey,
    consumerReplicas
  });

  roomClient.join();
});
</script>

<template>
  <PeerView
    :isMe='true'
    :peer='meStore.me'
    :audioProducerId='audioProducer ? audioProducer.id : null'
    :videoProducerId='videoProducer ? videoProducer.id : null'
    :audioRtpParameters='audioProducer ? audioProducer.rtpParameters : null'
    :videoRtpParameters='videoProducer ? videoProducer.rtpParameters : null'
    :audioTrack='audioProducer ? audioProducer.track : null'
    :videoTrack='videoProducer ? videoProducer.track : null'
    :videoVisible='videoVisible'
    :audioCodec='audioProducer ? audioProducer.codec : null'
    :videoCodec='videoProducer ? videoProducer.codec : null'
    :audioScore='audioProducer ? audioProducer.score : null'
    :videoScore='videoProducer ? videoProducer.score : null'
    :faceDetection='false'
    :onStatsClick='onSetStatsPeerId'
  />
</template>

<script setup>
import PeerView from "@/components/PeerView.vue";
import {useMeStore} from "@/stores/me.js";
import {useRoomStore} from "@/stores/room.js";
import {useProducersStore} from "@/stores/producers.js";
import {computed, onMounted, ref} from "vue";

const meStore = useMeStore();
const roomStore = useRoomStore();
const producersStore = useProducersStore();

const producersArray = computed(() => {
  return Object.values(producersStore.producers);
});
const audioProducer = computed(() => {
  return producersArray.value.find((producer) => producer.track.kind === 'audio');
});
const videoProducer = computed(() => {
  return producersArray.value.find((producer) => producer.track.kind === 'video');
});
const videoVisible = ref(false);

const onSetStatsPeerId = () => {
  roomStore.setRoomStatsPeerId(meStore.me.id)
};

onMounted(() => {

});

</script>
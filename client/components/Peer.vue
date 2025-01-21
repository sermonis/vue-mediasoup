<template>
  <PeerView
    :peer='props.peer'
    :audioConsumerId='audioConsumer ? audioConsumer.id : null'
    :videoConsumerId='videoConsumer ? videoConsumer.id : null'
    :audioRtpParameters='audioConsumer ? audioConsumer.rtpParameters : null'
    :videoRtpParameters='videoConsumer ? videoConsumer.rtpParameters : null'
    :consumerSpatialLayers='videoConsumer ? videoConsumer.spatialLayers : null'
    :consumerTemporalLayers='videoConsumer ? videoConsumer.temporalLayers : null'
    :consumerCurrentSpatialLayer='videoConsumer ? videoConsumer.currentSpatialLayer : null'
    :consumerCurrentTemporalLayer='videoConsumer ? videoConsumer.currentTemporalLayer : null'
    :consumerPreferredSpatialLayer='videoConsumer ? videoConsumer.preferredSpatialLayer : null'
    :consumerPreferredTemporalLayer='videoConsumer ? videoConsumer.preferredTemporalLayer : null'
    :consumerPriority='videoConsumer ? videoConsumer.priority : null'
    :audioTrack='audioConsumer ? audioConsumer.track : null'
    :videoTrack='videoConsumer ? videoConsumer.track : null'
    :audioMuted='audioMuted'
    :videoVisible='videoVisible'
    :videoMultiLayer="videoConsumer && videoConsumer.type !== 'simple'"
    :audioCodec='audioConsumer ? audioConsumer.codec : null'
    :videoCodec='videoConsumer ? videoConsumer.codec : null'
    :audioScore='audioConsumer ? audioConsumer.score : null'
    :videoScore='videoConsumer ? videoConsumer.score : null'
    :faceDetection='false'
    :onChangeVideoPreferredLayers='onChangeVideoPreferredLayers'
    :onChangeVideoPriority='onChangeVideoPriority'
    :onRequestKeyFrame='onRequestKeyFrame'
    :onStatsClick='onSetStatsPeerId'
  />
</template>

<script setup>
import {computed, onMounted, ref} from "vue";
import PeerView from "@/components/PeerView.vue";
import {useRoomStore} from "@/stores/room.js";
import {useConsumersStore} from "@/stores/consumers.js";

const roomStore = useRoomStore();
const consumersStore = useConsumersStore();

const props = defineProps({
  peer: {
    type: Object,
    required: true
  }
});

const ConsumersArray = computed(() => {
  return props.peer.consumers.map((consumerId) => consumersStore.consumers[consumerId]);
});
const audioConsumer = computed(() => {
  return ConsumersArray.value.find((consumer) => consumer.track.kind === 'audio');
});
const videoConsumer = computed(() => {
  return ConsumersArray.value.find((consumer) => consumer.track.kind === 'video');
});
const audioMuted = ref(true);
const videoVisible = ref(false);

const onChangeVideoPreferredLayers = (spatialLayer, temporalLayer) => {
  roomClient.setConsumerPreferredLayers(videoConsumer.id, spatialLayer, temporalLayer);
};

const onChangeVideoPriority = (priority) => {
  roomClient.setConsumerPriority(videoConsumer.id, priority);
};
const onRequestKeyFrame = () => {
  roomClient.requestConsumerKeyFrame(videoConsumer.id);
};
const onSetStatsPeerId = () => {
  roomStore.setRoomStatsPeerId(props.peer.id)
};

onMounted(() => {

});

</script>
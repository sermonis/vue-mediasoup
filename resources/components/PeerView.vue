<template>
  <div class="video">
    <video ref="videoRef" autoplay muted></video>
    <audio ref="audioRef" autoplay muted></audio>
    <div class="micro">
      <div class="level" :class="`level-${audioVolume}`"></div>
    </div>
    <div class="username">
      {{ props.peer.displayName }}
    </div>
  </div>
</template>

<script setup>
import {onMounted, ref, watch} from "vue";
import hark from 'hark';
// import * as faceapi from 'face-api.js';

const props = defineProps({
  isMe: {
    type: Boolean,
  },
  peer: {
    type: Object,
    required: true
  },
  audioProducerId: {
    type: String,
  },
  videoProducerId: {
    type: String,
  },
  audioConsumerId: {
    type: String,
  },
  videoConsumerId: {
    type: String,
  },
  audioRtpParameters: {
    type: Object,
  },
  videoRtpParameters: {
    type: Object,
  },
  consumerSpatialLayers: {
    type: Number,
  },
  consumerTemporalLayers: {
    type: Number,
  },
  consumerCurrentSpatialLayer: {
    type: Number,
  },
  consumerCurrentTemporalLayer: {
    type: Number,
  },
  consumerPreferredSpatialLayer: {
    type: Number,
  },
  consumerPreferredTemporalLayer: {
    type: Number,
  },
  consumerPriority: {
    type: Number,
  },
  audioTrack: {
    type: [Object, null],
  },
  videoTrack: {
    type: [Object, null],
  },
  audioMuted: {
    type: Boolean,
  },
  videoVisible: {
    type: Boolean,
    required: true
  },
  videoMultiLayer: {
    type: Boolean,
  },
  audioCodec: {
    type: String,
  },
  videoCodec: {
    type: String,
  },
  audioScore: {
    type: [Object, null],
  },
  videoScore: {
    type: [Object, null],
  },
  faceDetection: {
    type: Boolean,
    required: true
  },
  onChangeDisplayName: {
    type: Function,
  },
  onChangeMaxSendingSpatialLayer: {
    type: Function,
  },
  onChangeVideoPreferredLayers: {
    type: Function,
  },
  onChangeVideoPriority: {
    type: Function,
  },
  onRequestKeyFrame: {
    type: Function,
  },
  onStatsClick: {
    type: Function,
    required: true
  }
});

const videoRef = ref();
const audioRef = ref();

const audioVolume = ref(0);
const showInfo = ref(null);
const videoResolutionWidth = ref(null);
const videoResolutionHeight = ref(null);
const videoCanPlay = ref(false);
const videoRefPaused = ref(false);
const maxSpatialLayer = ref(null);

const audioTrack = ref(null);
const videoTrack = ref(null);
const harkRef = ref(null);
const videoResolutionPeriodicTimer = ref(null);
const faceDetectionRequestAnimationFrame = ref(null);

// 监听传参
watch(props, (newProps) => {
  audioTrack.value = newProps.audioTrack;
  videoTrack.value = newProps.videoTrack;
});

const setTracks = () => {
  if (harkRef.value) {
    harkRef.value.stop();
  }

  stopVideoResolution();

  if (props.faceDetection) {
    stopFaceDetection();
  }

  // 监听音频
  watch(audioTrack, (newAudioTrack) => {
    if (newAudioTrack) {
      const stream = new MediaStream;

      stream.addTrack(newAudioTrack);
      audioRef.value.srcObject = stream;

      audioRef.value.play().catch((error) => console.warn('audioRef.play() failed:%o', error));

      runHark(stream);
    } else {
      audioRef.value.srcObject = null;
      harkRef.value.stop();
    }
  });

  // 监听视频
  watch(videoTrack, (newVideoTrack) => {
    if (newVideoTrack) {
      const stream = new MediaStream;

      stream.addTrack(newVideoTrack);
      videoRef.value.srcObject = stream;

      videoRef.value.oncanplay = () => videoCanPlay.value = true;

      videoRef.value.onplay = () => {
        videoRefPaused.value = false;

        audioRef.value.play().catch((error) => console.warn('audioRef.play() failed:%o', error));
      };

      videoRef.value.onpause = () => videoRefPaused.value = true;

      videoRef.value.play().catch((error) => console.warn('videoRef.play() failed:%o', error));

      startVideoResolution();

      if (props.faceDetection) {
        startFaceDetection();
      }
    } else {
      videoRef.value.srcObject = null;
    }
  });

}

const stopVideoResolution = () => {
  clearInterval(videoResolutionPeriodicTimer.value);

  videoResolutionWidth.value = null;
  videoResolutionHeight.value = null;
}

const startFaceDetection = () => {
  // const { videoElem, canvas } = this.refs;

  const step = async () => {
    // NOTE: Somehow this is critical. Otherwise the Promise returned by
    // faceapi.detectSingleFace() never resolves or rejects.
    if (!props.videoTrack || videoRef.value.readyState < 2) {
      faceDetectionRequestAnimationFrame.value = requestAnimationFrame(step);

      return;
    }

    // const detection = await faceapi.detectSingleFace(videoRef.value, tinyFaceDetectorOptions);
    //
    // if (detection) {
    //   const width = videoRef.value.offsetWidth;
    //   const height = videoRef.value.offsetHeight;
    //
    //   canvas.value.width = width;
    //   canvas.value.height = height;
    //
    //   const resizedDetection = detection.forSize(width, height);
    //   const resizedDetections = faceapi.resizeResults(detection, { width, height });
    //
    //   faceapi.draw.drawDetections(canvas.value, resizedDetections);
    // }
    // else {
    //   // Trick to hide the canvas rectangle.
    //   canvas.value.width = 0;
    //   canvas.value.height = 0;
    // }

    faceDetectionRequestAnimationFrame.value = requestAnimationFrame(() => setTimeout(step, 100));
  };

  step();
}

const stopFaceDetection = () => {
  cancelAnimationFrame(faceDetectionRequestAnimationFrame.value);

  // const { canvas } = this.refs;
  //
  // canvas.width = 0;
  // canvas.height = 0;
}

const startVideoResolution = () => {
  videoResolutionPeriodicTimer.value = setInterval(() => {
    if (videoRef.value.videoWidth !== videoResolutionWidth.value || videoRef.value.videoHeight !== videoResolutionHeight.value) {
      videoResolutionWidth.value = videoRef.value.videoWidth;
      videoResolutionHeight.value = videoRef.value.videoHeight;
    }
  }, 500);
}

const runHark = (stream) => {
  if (!stream.getAudioTracks()[0]) {
    throw new Error('_runHark() | given stream has no audio track');
  }

  harkRef.value = hark(stream, {play: false});

  // eslint-disable-next-line no-unused-vars
  harkRef.value.on('volume_change', (dBs, threshold) => {
    // The exact formula to convert from dBs (-100..0) to linear (0..1) is:
    //   Math.pow(10, dBs / 20)
    // However it does not produce a visually useful output, so let exagerate
    // it a bit. Also, let convert it from 0..1 to 0..10 and avoid value 1 to
    // minimize component renderings.
    let volume = Math.round(Math.pow(10, dBs / 85) * 10);

    if (volume === 1) {
      volume = 0;
    }

    if (volume !== audioVolume.value) {
      audioVolume.value = volume;
    }
  });
}

onMounted(() => {
  setTracks();
});
</script>

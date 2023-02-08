<template>
  <div id="moveLog">Mouse: {{ curPointPositionX }}, {{ curPointPositionY }}</div>
  <div id="viewCanvas">
    <canvas id="outLineCanvasWithRuler" ref="outCanvas" width="315" height="215"> Invalid Outline Canvas </canvas>
    <canvas
      id="mainCanvas"
      ref="mainCanvas"
      width="300"
      height="200"
      @mousedown="onHandleMouseDown"
      @mousemove="onHandleMouseMove"
    >
      Invalid Main Canvas
    </canvas>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from "vue";

export default defineComponent({
  name: "ReportBuilderView",
  setup() {
    const curPointPositionX = ref(0);
    const curPointPositionY = ref(0);

    const canvasOffsetX = ref(0);
    const canvasOffsetY = ref(0);

    const outCanvas = ref(null);
    const mainCanvas = ref(null);

    const clockURL = ref("../");

    //var ctxMainCanvas = mainCanvas?.getContext("2d");

    const Init = () => {
      let outLineCanvasRuler = outCanvas.value as HTMLCanvasElement | null;
      let ctxOutLineCanvasRuler = outLineCanvasRuler?.getContext("2d");

      if (outLineCanvasRuler?.offsetWidth != undefined) {
        canvasOffsetX.value = outLineCanvasRuler?.offsetWidth;

        console.log("offset X ", canvasOffsetX.value);
      }

      if (outLineCanvasRuler?.offsetHeight != undefined) {
        canvasOffsetY.value = outLineCanvasRuler?.offsetHeight;

        console.log("offset Y ", canvasOffsetY.value);
      }

      if (outLineCanvasRuler != undefined && outLineCanvasRuler != null) {
        ctxOutLineCanvasRuler?.beginPath();
        for (let i = 0; i < outLineCanvasRuler?.width; i += 10) {
          let y = i / 100 == parseInt((i / 100).toString()) ? 0 : 10;
          ctxOutLineCanvasRuler?.moveTo(i + 15, y);
          ctxOutLineCanvasRuler?.lineTo(i + 15, 15);
        }

        for (let i = 0; i < outLineCanvasRuler?.height; i += 10) {
          let x = i / 100 == parseInt((i / 100).toString()) ? 0 : 10;
          ctxOutLineCanvasRuler?.moveTo(x, i + 15);
          ctxOutLineCanvasRuler?.lineTo(15, i + 15);
        }
        ctxOutLineCanvasRuler?.stroke();
      }
    };

    const onHandleMouseDown = (e: MouseEvent): void => {
      curPointPositionX.value = e.clientX - canvasOffsetX.value;
      curPointPositionY.value = e.clientY - canvasOffsetY.value;

      console.log(`onHandleMouseDown) Cure Pos X: ${curPointPositionX.value} Y: ${curPointPositionY.value}`);
    };

    const onHandleMouseMove = (e: MouseEvent): void => {
      curPointPositionX.value = e.clientX - canvasOffsetX.value;
      curPointPositionY.value = e.clientY - canvasOffsetY.value;

      // console.log(
      //   `onHandleMouseMove) Cure Pos X: ${curPointPositionX.value} Y: ${curPointPositionY.value}`
      // );
    };

    onMounted(Init);

    return {
      outCanvas,
      mainCanvas,

      curPointPositionX,
      curPointPositionY,

      onHandleMouseDown,
      onHandleMouseMove,
    };
  },
});
</script>

<style scoped>
#viewCanvas {
  width: 315px;
  height: 215px;
}
#outLineCanvasWithRuler {
  position: absolute;
  top: 0px;
  left: 0px;
  border: 1px solid red;
}
#mainCanvas {
  position: absolute;
  top: 15px;
  left: 15px;
  border: 1px solid red;
}
</style>

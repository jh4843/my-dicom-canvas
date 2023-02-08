<template>
  <div id="report-view" :style="`min-width: ${canvasInfo.width}px; min-height: ${canvasInfo.height}px`">
    <input
      class="input-button"
      style="border: none"
      ref="fileInput"
      type="file"
      @change="onSelectedFile"
      enctype="multipart/form-data"
    />
    <div v-if="isShowDropBox" id="report-drop-box-container" class="canvas-container" ref="refDropBoxContainer">
      <div
        :style="`width: ${canvasInfo.width}px; height: ${canvasInfo.height}px`"
        id="report-drop-box"
        ref="refDropBoxElement"
      ></div>
    </div>
    <div v-else id="report-canvas-container" class="canvas-container" ref="refCanvasContainer">
      <canvas
        id="report-canvas"
        ref="refCanvasElement"
        :width="canvasInfo.width"
        :height="canvasInfo.height"
        @mousedown="onHandleMouseDown"
        @mousemove="onHandleMouseMove"
      >
        Invalid Main Canvas
      </canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, computed } from "vue";
import { CommonImage, type ICommonImageInfo, eImageSourceType } from "@/types/Image";
import { CommonCanvas, type ICommonCanvasInfo } from "@/types/Canvas";

interface Props {
  canvasWidth?: number;
  canvasHeight?: number;

  initFilePath?: string;
}

const props = withDefaults(defineProps<Props>(), {
  canvasWidth: 300,
  canvasHeight: 500,
  initFilePath: undefined,

  //initFilePath: "file:///C:/Users/2017387/Pictures/Logo.png",
});

const curPointPositionX = ref(0);
const curPointPositionY = ref(0);

const imageInfo: CommonImage = reactive(new CommonImage(eImageSourceType.image_source_type_img_file, "", 0, 0));
const canvasInfo: CommonCanvas = reactive(new CommonCanvas(0, 0, props.canvasWidth, props.canvasHeight, 1));

// refs
const refDropBoxContainer = ref(null);
const refDropBoxElement = ref(null);
const refCanvasContainer = ref(null);
const refCanvasElement = ref(null);

const getDropBoxStyle = computed(() => {});

const canvasContainer = computed(() => {
  return refCanvasContainer.value;
});

const canvasElement = computed(() => {
  return refCanvasElement.value;
});

const isOpenedDicomFile = ref(false);

const isShowDropBox = computed(() => {
  return !isOpenedDicomFile.value;
});

const showDropbox = (show: boolean): void => {
  isOpenedDicomFile.value = !show;

  imageInfo.srcType = eImageSourceType.image_source_type_img_file;
  imageInfo.srcName = "";

  console.log("showDropBox", show, isOpenedDicomFile.value);

  const boxContainer = document.getElementById("report-drop-box-container");
  const box = document.getElementById("report-drop-box");

  if (!box) {
    return;
  }

  if (show) {
    box.addEventListener("dragover", onHandleDragOverImage);
    // box.addEventListener('dragleave', this.onBoxDragLeave)
    box.addEventListener("drop", onHandleDropImage);

    if (boxContainer) {
      boxContainer.removeEventListener("dragover", onHandleDragOverImage);
      boxContainer.removeEventListener("drop", onHandleDropImage);
    }
  } else {
    box.removeEventListener("dragover", onHandleDragOverImage);
    box.removeEventListener("drop", onHandleDropImage);

    if (boxContainer) {
      boxContainer.addEventListener("dragover", onHandleDragOverImage);
      boxContainer.addEventListener("drop", onHandleDropImage);
    }
  }
};

const onResizeWindow = (e: Event) => {
  const mainCanvasDiv = canvasContainer.value as HTMLDivElement | null;

  if (canvasElement.value == undefined || mainCanvasDiv == null) {
    return;
  }

  if (isOpenedDicomFile.value) {
    //canvasInfo.width = mainCanvasDiv.offsetWidth;
    //canvasInfo.height = mainCanvasDiv.offsetHeight;
    //reDrawImage();
    // console.log("onResizeWindow1: ", mainCanvasDiv?.offsetWidth, mainCanvasDiv?.offsetHeight);
    // console.log("onResizeWindow2: ", window.innerWidth, window.innerHeight);
  }
};

// const updateCanvasInfo = (info: CommonCanvas) => {
//   canvasInfo.set(info);
// };

const init = () => {
  canvasInfo.width = props.canvasWidth;
  canvasInfo.height = props.canvasHeight;

  if (props.initFilePath != undefined || props.initFilePath == "") {
    showDropbox(false);
    //loadLocalFile(props.initFilePath);
  } else {
    showDropbox(true);
  }

  window.addEventListener("resize", onResizeWindow);
};

const onSelectedFile = (e: Event) => {
  e.preventDefault();

  if (e == undefined || e.target == undefined || e.target.files.length < 1) return;

  loadImage(e.target.files[0]);

  console.log("onSelectedFile: ", e, e.target.files[0]);
};

const onHandleDragOverImage = (e: DragEvent) => {
  //const eventDataTransfer = e.dataTransfer;
  e.stopPropagation();
  e.preventDefault();

  //console.log("onHandleDragOverImage", e.dataTransfer);
};

const loadLocalFile = (file: string) => {
  console.log("loadLocalFile: ", file);

  let request = new XMLHttpRequest();
  request.open("GET", file, true);
  request.responseType = "blob";
  request.onload = function () {
    loadImage(request.response);
  };
  request.send();
};

const loadImage = (src: File) => {
  const reader = new FileReader();
  reader.addEventListener("load", (event) => {
    console.log("Loaded: ", event);
    let img = new Image();
    if (reader.result != null) {
      if (typeof reader.result === "string") {
        img.src = reader.result;
      } else {
        console.log("type error: ", reader.result);
      }
    }
    showDropbox(false);
    img.onload = function () {
      drawImage(img);
    };
  });
  if (src != undefined) {
    reader.readAsDataURL(src);
    console.log("file name: ", src);
  }
};

const drawImage = (img: HTMLImageElement) => {
  console.log("draw Image: ", img.constructor.name);

  imageInfo.srcType = eImageSourceType.image_source_type_img_file;
  imageInfo.srcName = img.src;

  imageInfo.width = img.width;
  imageInfo.height = img.height;

  let ratio = 1;
  const mainCanvasDiv = canvasContainer.value as HTMLDivElement | null;

  if (mainCanvasDiv == null) {
    return;
  }

  let mainCanvasElement = canvasElement.value as HTMLCanvasElement | null;
  let ctxMainCanvasElement = mainCanvasElement?.getContext("2d");

  if (mainCanvasElement == undefined) {
    return;
  }

  let _canvasWidth = mainCanvasElement?.width;
  let _canvasHeight = mainCanvasElement?.height;

  console.log("size: ", mainCanvasElement?.width, mainCanvasElement?.height, mainCanvasElement.style);

  if (_canvasWidth == null || _canvasHeight == null) {
    console.log("Invalid canvas size");
    return;
  }

  if (imageInfo.width < imageInfo.height) {
    ratio = _canvasHeight / imageInfo.height;
  } else {
    ratio = _canvasWidth / imageInfo.width;
  }

  var centerShiftX = (_canvasWidth - imageInfo.width * ratio) / 2;
  var centerShiftY = (_canvasHeight - imageInfo.height * ratio) / 2;

  let width = imageInfo.width * ratio;
  let height = imageInfo.height * ratio;

  if (ctxMainCanvasElement != undefined && ctxMainCanvasElement != null) {
    ctxMainCanvasElement.drawImage(
      img,
      0,
      0,
      imageInfo.width,
      imageInfo.height,
      centerShiftX,
      centerShiftY,
      width,
      height
    );

    console.log("draw: ", imageInfo.width, imageInfo.height);

    var dataURI = mainCanvasElement?.toDataURL("image/jpeg");

    console.log("Draw image: ", imageInfo.width, imageInfo.height, ratio, dataURI);
  }
};

const onHandleDropImage = (e: DragEvent) => {
  //const eventDataTransfer = e.dataTransfer;
  e.stopPropagation();
  e.preventDefault();

  const reader = new FileReader();

  reader.addEventListener("load", (event) => {
    console.log("Loaded: ", event);

    let img = new Image();

    if (reader.result != null) {
      if (typeof reader.result === "string") {
        img.src = reader.result;
      } else {
        console.log("type error: ", reader.result);
      }
    }

    showDropbox(false);

    img.onload = function () {
      drawImage(img);
    };
  });

  if (e.dataTransfer != undefined && e.dataTransfer.files.length > 0) {
    reader.readAsDataURL(e.dataTransfer.files[0]);
    console.log("file name: ", e.dataTransfer.files[0].name);
  }

  //showDropbox(false);
};

const onHandleMouseDown = (e: MouseEvent): void => {
  curPointPositionX.value = e.clientX;
  curPointPositionY.value = e.clientY;

  console.log(`onHandleMouseDown) Cure Pos X: ${curPointPositionX.value} Y: ${curPointPositionY.value}`);

  //console.log(e);
};

const onHandleMouseMove = (e: MouseEvent): void => {
  curPointPositionX.value = e.clientX;
  curPointPositionY.value = e.clientY;

  // console.log(
  //   `onHandleMouseMove) Cure Pos X: ${curPointPositionX.value} Y: ${curPointPositionY.value}`
  // );
};

onMounted(init);
</script>

<style scoped>
.canvas-container {
  display: flex;
  flex-direction: column;

  justify-content: center;
  align-items: center;

  width: 100%;
  height: 90%;
}

.input-button {
  width: 100%;
  height: 10%;
}

#report-view {
  width: 100%;
  height: 100%;

  border: 1px solid red;
}

#report-canvas {
  border: 1px solid blue;
}

#report-drop-box {
  box-sizing: border-box;
  text-align: center;
  vertical-align: middle;
  /* width: 80%;
  height: 80%; */
}
#report-drop-box {
  border: 5px dashed rgba(68, 138, 255, 0.38);
}
#report-drop-box.hover {
  border: 5px dashed var(--md-theme-default-primary);
}

@media print {
  .input-button,
  .input * {
    display: none !important;
  }
}
</style>

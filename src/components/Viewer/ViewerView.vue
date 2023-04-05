<template>
  <div id="viewer-view" :style="`min-width: ${canvasInfo.width}px; min-height: ${canvasInfo.height}px`">
    <input
      class="input-button"
      style="border: none"
      ref="fileInput"
      type="file"
      @change="onSelectedFile"
      enctype="multipart/form-data"
    />
    <div v-if="isShowDropBox" id="viewer-drop-box-container" class="canvas-container" ref="refDropBoxContainer">
      <div
        :style="`width: ${canvasInfo.width}px; height: ${canvasInfo.height}px`"
        id="viewer-drop-box"
        ref="refDropBoxElement"
      ></div>
    </div>
    <div v-else id="viewer-canvas-container" class="canvas-container" ref="refCanvasContainer">
      <canvas
        id="viewer-canvas"
        ref="refCanvasElement"
        :width="canvasInfo.width"
        :height="canvasInfo.height"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
      >
        Invalid Main Canvas
      </canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, computed, watch } from "vue";
import { CommonImage, eImageSourceType } from "@/types/Image";
import { CommonCanvas } from "@/types/Canvas";
import { Point2D } from "@/math/Point";
import type MyImage from "@/components/Image/MyImage";
import type * as MyType from "@/types";
import FileLoaderManager from "@/components/IO/FileLoaderManager";

interface Props {
  canvasWidth?: number;
  canvasHeight?: number;

  initFilePath?: string;
}

const props = withDefaults(defineProps<Props>(), {
  canvasWidth: 360,
  canvasHeight: 500,
  initFilePath: undefined,

  //initFilePath: "file:///C:/Users/2017387/Pictures/Logo.png",
});

var c = document.getElementById("viewer-canvas");

const curPointPositionX = ref(0);
const curPointPositionY = ref(0);

const imageInfo: CommonImage = reactive(
  new CommonImage({ type: eImageSourceType.image_source_type_img_file, name: "", width: 0, height: 0 })
);
const canvasInfo: CommonCanvas = reactive(new CommonCanvas(0, 0, props.canvasWidth, props.canvasHeight, 1));

// refs
const refDropBoxContainer = ref(null);
const refDropBoxElement = ref(null);
const refCanvasContainer = ref(null);
const refCanvasElement = ref(null);

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

  imageInfo.info.type = eImageSourceType.image_source_type_img_file;
  imageInfo.info.name = "";

  const boxContainer = document.getElementById("viewer-drop-box-container");
  const box = document.getElementById("viewer-drop-box");

  if (!box) {
    return;
  }

  if (show) {
    box.addEventListener("dragover", onDragOverImage);
    // box.addEventListener('dragleave', this.onBoxDragLeave)
    box.addEventListener("drop", onDropImage);

    if (boxContainer) {
      boxContainer.removeEventListener("dragover", onDragOverImage);
      boxContainer.removeEventListener("drop", onDropImage);
    }
  } else {
    box.removeEventListener("dragover", onDragOverImage);
    box.removeEventListener("drop", onDropImage);

    if (boxContainer) {
      boxContainer.addEventListener("dragover", onDragOverImage);
      boxContainer.addEventListener("drop", onDropImage);
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
  e.stopPropagation();
  e.preventDefault();

  showDropbox(false);

  if (e == undefined || e.target == undefined || e.target.files.length < 1) return;

  const fileLoaderManager = new FileLoaderManager();

  fileLoaderManager.loadFiles(e.target.files);

  fileLoaderManager.onloadend = (event) => {
    if (event.src == undefined) {
      console.log("onloadend) invalid src", event.src);
      return;
    }

    draw(event);

    //loadImage(event.src);
  };
};

const draw = (event) => {
  let mainCanvasElement = canvasElement.value as HTMLCanvasElement | null;
  let ctxMainCanvasElement = mainCanvasElement?.getContext("2d");

  let myImage: MyImage | undefined = event.data?.image;
  let imageInfo: MyType.iImageMetaInfo | undefined = event.data?.info;

  if (ctxMainCanvasElement == undefined || myImage == undefined || imageInfo == undefined || myImage.buffer == null) {
    console.log("onloadend) invalid src", mainCanvasElement, ctxMainCanvasElement, myImage, imageInfo);
    return;
  }

  let dataLen = imageInfo.imageWidth * imageInfo.imageHeight * 4;

  const displayBuffer = new Uint8ClampedArray(dataLen);

  let index = 0;
  for (let i = 0; i < dataLen; i += 4) {
    index = i - i / 4;
    displayBuffer[i] = myImage.buffer[index];
    displayBuffer[i + 1] = myImage.buffer[index + 1];
    displayBuffer[i + 2] = myImage.buffer[index + 2];
    displayBuffer[i + 3] = 255;
  }

  const imgData = new ImageData(displayBuffer, imageInfo.imageWidth, imageInfo.imageHeight);

  const ptCanvasCenter = new Point2D(canvasInfo.width / 2, canvasInfo.height / 2);
  const ptLeftTop = new Point2D(
    ptCanvasCenter.x - imageInfo.imageWidth / 2,
    ptCanvasCenter.y - imageInfo.imageHeight / 2
  );

  ctxMainCanvasElement?.putImageData(imgData, ptLeftTop.x, ptLeftTop.y);

  console.log("draw) complete", imgData, imageInfo.imageWidth, imageInfo.imageHeight, ptLeftTop, ptCanvasCenter);
};

const onDragOverImage = (e: DragEvent) => {
  //const eventDataTransfer = e.dataTransfer;
  e.stopPropagation();
  e.preventDefault();

  //console.log("onDragOverImage", e.dataTransfer);
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

  console.log("loadImage: ", refCanvasElement);

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
  imageInfo.info.type = eImageSourceType.image_source_type_img_file;
  imageInfo.info.name = img.src;

  imageInfo.info.width = img.width;
  imageInfo.info.height = img.height;

  let ratio = 1;
  const mainCanvasDiv = canvasContainer.value as HTMLDivElement | null;

  if (mainCanvasDiv == null) {
    return;
  }

  let mainCanvasElement = canvasElement.value as HTMLCanvasElement | null;
  let ctxMainCanvasElement = mainCanvasElement?.getContext("2d");

  console.log("draw Image: ", refCanvasElement, canvasElement);

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

  if (imageInfo.info.width < imageInfo.info.height) {
    ratio = _canvasHeight / imageInfo.info.height;
  } else {
    ratio = _canvasWidth / imageInfo.info.width;
  }

  var centerShiftX = (_canvasWidth - imageInfo.info.width * ratio) / 2;
  var centerShiftY = (_canvasHeight - imageInfo.info.height * ratio) / 2;

  let width = imageInfo.info.width * ratio;
  let height = imageInfo.info.height * ratio;

  console.log("drawImage: ", imageInfo.info.width, imageInfo.info.height, ratio, width, height);

  if (ctxMainCanvasElement != undefined && ctxMainCanvasElement != null) {
    ctxMainCanvasElement.drawImage(
      img,
      0,
      0,
      imageInfo.info.width,
      imageInfo.info.height,
      centerShiftX,
      centerShiftY,
      width,
      height
    );

    imageInfo.data = ctxMainCanvasElement.getImageData(0, 0, imageInfo.info.width, imageInfo.info.height);

    //var dataURI = mainCanvasElement?.toDataURL("image/jpeg");
    //console.log("Draw image: ", imageInfo.info.width, imageInfo.info.height, ratio, dataURI);

    console.log("Draw image: ", imageInfo.info.width, imageInfo.info.height, ratio);
  }
};

const onDropImage = (e: DragEvent) => {
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
        console.log("img: ", img);
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

const onMouseDown = (e: MouseEvent): void => {
  curPointPositionX.value = e.clientX;
  curPointPositionY.value = e.clientY;

  console.log(`onMouseDown) Cure Pos X: ${curPointPositionX.value} Y: ${curPointPositionY.value}`);

  //console.log(e);
};

const onMouseMove = (e: MouseEvent): void => {
  curPointPositionX.value = e.clientX;
  curPointPositionY.value = e.clientY;

  // console.log(
  //   `onMouseMove) Cure Pos X: ${curPointPositionX.value} Y: ${curPointPositionY.value}`
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

#viewer-view {
  width: 100%;
  height: 100%;

  border: 1px solid red;
}

#viewer-canvas {
  border: 1px solid blue;
}

#viewer-drop-box {
  box-sizing: border-box;
  text-align: center;
  vertical-align: middle;
  /* width: 80%;
  height: 80%; */
}
#viewer-drop-box {
  border: 5px dashed rgba(68, 138, 255, 0.38);
}
#viewer-drop-box.hover {
  border: 5px dashed var(--md-theme-default-primary);
}

@media print {
  .input-button,
  .input * {
    display: none !important;
  }
}
</style>

<template>
  <div class="viewer-container">
    <ViewerView></ViewerView>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ViewerView from "./ViewerView.vue";

export default defineComponent({
  // eslint-disable-next-line vue/multi-word-component-names
  name: "Viewer",
  components: { ViewerView },

  setup() {
    return {};
  },
});
</script>

<style scoped>
.viewer-container {
  width: 100%;
  height: 100%;
}
</style>

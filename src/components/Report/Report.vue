<template>
  <div class="report-container">
    <ReportView></ReportView>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ReportView from "./ReportView.vue";

export default defineComponent({
  // eslint-disable-next-line vue/multi-word-component-names
  name: "Report",
  components: { ReportView },

  setup() {
    return {};
  },
});
</script>

<style scoped>
.report-container {
  width: 100%;
  height: 100%;
}
</style>

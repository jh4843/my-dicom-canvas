<template>
  <div id="ReportBuilder">
    <ReportBuilderView></ReportBuilderView>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ReportBuilderView from "./ReportBuilderView.vue";

export default defineComponent({
  name: "ReportBuilder",

  components: { ReportBuilderView },

  setup() {
    return {};
  },
});
</script>

<style scoped></style>

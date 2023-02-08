<template>
  <main id="mainView">
    <div class="main-div">
      <Report class="main-report-view"></Report>
      <!-- <ReportBuilder class="main-report-builder"></ReportBuilder> -->
    </div>
  </main>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Report from "./components/Report/Report.vue";
//import ReportBuilder from "./components/ReportBuilder/ReportBuilder.vue";

export default defineComponent({
  name: "App",

  components: { Report },

  setup() {
    return {};
  },
});
</script>

<style scoped>
#app {
  width: 100%;
}

#mainView {
  width: 90%;
  height: 90%;
}

.main-div {
  width: 100%;
  height: 100%;

  box-sizing: border-box;

  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
  align-content: center;
}
</style>

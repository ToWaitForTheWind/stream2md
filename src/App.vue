<script setup lang="ts">
/**
 * 根组件
 * 开发环境演示入口
 */
import HelloWorld from './components/HelloWorld.vue'
</script>

<template>
  <div class="app">
    <HelloWorld msg="Stream2md 插件" />
  </div>
</template>

<style lang="scss" scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-xl;
}
</style>

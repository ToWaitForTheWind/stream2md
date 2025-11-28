<script setup lang="ts">
/**
 * HelloWorld 示例组件
 * 演示 Vue3 + TypeScript + SCSS 的使用
 */
import { ref } from 'vue'

// 定义组件属性
defineProps<{
  msg: string
}>()

// 计数器状态
const count = ref(0)
</script>

<template>
  <div class="hello-world">
    <h1 class="title">{{ msg }}</h1>

    <div class="card">
      <button type="button" class="btn btn--primary" @click="count++">
        点击次数: {{ count }}
      </button>
      <p class="hint">
        编辑 <code>components/HelloWorld.vue</code> 测试热更新
      </p>
    </div>

    <p class="description">
      这是 <strong>stream2md</strong> Vue3 插件项目的示例组件
    </p>
  </div>
</template>

<style lang="scss" scoped>
// 引入变量（通过 vite.config.ts 全局注入，可直接使用）

.hello-world {
  text-align: center;
  padding: $spacing-xl;

  .title {
    font-size: 2.5rem;
    color: $primary-color;
    margin-bottom: $spacing-lg;
  }

  .card {
    display: inline-block;
    padding: $spacing-lg $spacing-xl;
    background: white;
    border-radius: $border-radius-lg;
    box-shadow: $box-shadow-md;
    margin-bottom: $spacing-lg;

    .btn {
      margin-bottom: $spacing-md;
    }

    .hint {
      color: $text-secondary;
      font-size: $font-size-sm;

      code {
        background-color: rgba($primary-color, 0.1);
        padding: 2px 6px;
        border-radius: $border-radius-sm;
        color: $primary-dark;
      }
    }
  }

  .description {
    color: $text-secondary;
    
    strong {
      color: $primary-color;
    }
  }
}
</style>

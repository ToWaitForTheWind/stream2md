<template>
  <div class="demo-view">
    <header class="demo-header">
      <h1>Stream2MD 流式渲染演示 (VNode)</h1>
      <p class="subtitle">使用 VNode 方式渲染</p>
    </header>

    <div class="demo-controls">
      <button 
        class="btn btn-primary" 
        @click="startStreaming" 
        :disabled="isStreaming"
      >
        {{ isStreaming ? '渲染中...' : '开始流式渲染' }}
      </button>
      <button 
        class="btn btn-secondary" 
        @click="resetContent"
        :disabled="isStreaming"
      >
        重置
      </button>
      <div class="speed-control">
        <label>速度：</label>
        <input 
          type="range" 
          v-model.number="streamSpeed" 
          min="5" 
          max="100" 
          :disabled="isStreaming"
        />
        <span>{{ streamSpeed }}ms/字</span>
      </div>
      <router-link to="/demo-html" class="btn btn-link">
        切换到 v-html 版本 →
      </router-link>
    </div>

    <div class="demo-content" ref="contentRef">
      <MDContent v-model:modelValue="displayContent" />
    </div>

    <footer class="demo-footer">
      <p>已渲染: {{ displayContent.length }} / {{ sampleMarkdown.length }} 字符</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
/**
 * DemoView - 演示页面
 * 展示流式 Markdown 渲染效果
 */
import { ref, nextTick, onUnmounted } from 'vue'
import MDContent from '../components/MDContent.vue'
import { sampleMarkdown } from '../data/sampleMarkdown'

// 内容容器 DOM 引用
const contentRef = ref<HTMLElement | null>(null)
// 当前显示的内容
const displayContent = ref('')
// 是否正在流式输出
const isStreaming = ref(false)
// 流式输出速度（毫秒/字符）
const streamSpeed = ref(20)
// 定时器引用
let streamTimer: ReturnType<typeof setTimeout> | null = null
// 滚动节流计数器
let scrollCounter = 0

/**
 * 开始流式渲染
 */
const startStreaming = () => {
  if (isStreaming.value) return
  
  displayContent.value = ''
  isStreaming.value = true
  scrollCounter = 0
  
  let currentIndex = 0
  const totalLength = sampleMarkdown.length
  
  const streamNextChar = () => {
    if (currentIndex < totalLength) {
      displayContent.value = sampleMarkdown.slice(0, currentIndex + 1)
      currentIndex++
      scrollCounter++
      
      // 每 10 个字符滚动一次
      if (scrollCounter >= 10) {
        scrollCounter = 0
        nextTick(scrollToBottom)
      }
      
      streamTimer = setTimeout(streamNextChar, streamSpeed.value)
    } else {
      isStreaming.value = false
      streamTimer = null
      nextTick(scrollToBottom)
    }
  }
  
  streamNextChar()
}

/**
 * 滚动到内容底部
 */
const scrollToBottom = () => {
  if (contentRef.value) {
    contentRef.value.scrollTop = contentRef.value.scrollHeight
  }
}

/**
 * 重置内容
 */
const resetContent = () => {
  if (streamTimer) {
    clearTimeout(streamTimer)
    streamTimer = null
  }
  isStreaming.value = false
  displayContent.value = ''
}

onUnmounted(() => {
  if (streamTimer) clearTimeout(streamTimer)
})
</script>

<style lang="scss" scoped>
.demo-view {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.demo-header {
  text-align: center;
  margin-bottom: 2rem;
  
  h1 {
    font-size: 2.2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 0.5rem;
  }
  
  .subtitle {
    color: #888;
    font-size: 0.95rem;
  }
}

.demo-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  flex-wrap: wrap;
  
  .btn {
    padding: 0.6rem 1.2rem;
    border: none;
    border-radius: 6px;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    &.btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      
      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }
    }
    
    &.btn-secondary {
      background: #e9ecef;
      color: #495057;
      
      &:hover:not(:disabled) {
        background: #dee2e6;
      }
    }
    
    &.btn-link {
      background: transparent;
      color: #f5576c;
      margin-left: auto;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
  
  .speed-control {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    label {
      color: #666;
      font-size: 0.9rem;
    }
    
    input[type="range"] {
      width: 100px;
      accent-color: #667eea;
    }
    
    span {
      font-size: 0.85rem;
      color: #888;
      min-width: 70px;
    }
  }
}

.demo-content {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 2rem;
  height: calc(100vh - 411px);
  overflow-y: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
    
    &:hover {
      background: #a1a1a1;
    }
  }
}

.demo-footer {
  margin-top: 1rem;
  text-align: center;
  
  p {
    color: #888;
    font-size: 0.9rem;
  }
}
</style>

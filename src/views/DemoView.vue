<template>
  <div class="demo-view">
    <!-- 侧边性能监控面板 -->
    <aside class="perf-sidebar">
      <div class="perf-title">性能监控</div>
      <div class="perf-item" :class="{ warn: perfMetrics.fps < 30 }">
        <span class="label">FPS</span>
        <span class="value">{{ perfMetrics.fps }}</span>
        <span class="extremes">↓{{ extremes.fpsMin }} ↑{{ extremes.fpsMax }}</span>
      </div>
      <div class="perf-item" :class="{ warn: perfMetrics.renderTime > 16 }">
        <span class="label">渲染耗时</span>
        <span class="value">{{ perfMetrics.renderTime.toFixed(1) }}ms</span>
        <span class="extremes">max: {{ extremes.renderTimeMax.toFixed(1) }}ms</span>
      </div>
      <div class="perf-item" :class="{ warn: perfMetrics.domNodes > 5000 }">
        <span class="label">DOM Nodes</span>
        <span class="value">{{ perfMetrics.domNodes.toLocaleString() }}</span>
        <span class="extremes">max: {{ extremes.domNodesMax.toLocaleString() }}</span>
      </div>
      <div class="perf-item" :class="{ warn: perfMetrics.heapSize > 150 }">
        <span class="label">JS Heap</span>
        <span class="value">{{ perfMetrics.heapSize.toFixed(1) }}MB</span>
        <span class="extremes">max: {{ extremes.heapSizeMax.toFixed(1) }}MB</span>
      </div>
      <div class="perf-item">
        <span class="label">吞吐量</span>
        <span class="value">{{ perfMetrics.throughput }}</span>
        <span class="extremes">max: {{ extremes.throughputMax }} 字/秒</span>
      </div>
      <div class="perf-item" :class="{ warn: perfMetrics.eventListeners > 200 }">
        <span class="label">Listeners</span>
        <span class="value">{{ perfMetrics.eventListeners }}</span>
        <span class="extremes">max: {{ extremes.eventListenersMax }}</span>
      </div>
      <div class="perf-item">
        <span class="label">Documents</span>
        <span class="value">{{ perfMetrics.documents }}</span>
        <span class="extremes">max: {{ extremes.documentsMax }}</span>
      </div>
      <div class="perf-item">
        <span class="label">Frames</span>
        <span class="value">{{ perfMetrics.frames }}</span>
        <span class="extremes">max: {{ extremes.framesMax }}</span>
      </div>
      <div class="perf-item" :class="{ warn: perfMetrics.layoutsPerSec > 10 }">
        <span class="label">Layouts/s</span>
        <span class="value">{{ perfMetrics.layoutsPerSec }}</span>
        <span class="extremes">max: {{ extremes.layoutsPerSecMax }}</span>
      </div>
      <div class="perf-item" :class="{ warn: perfMetrics.recalcsPerSec > 10 }">
        <span class="label">Recalcs/s</span>
        <span class="value">{{ perfMetrics.recalcsPerSec }}</span>
        <span class="extremes">max: {{ extremes.recalcsPerSecMax }}</span>
      </div>
    </aside>

    <main class="demo-main">
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
    </main>
  </div>
</template>

<script setup lang="ts">
/**
 * DemoView - 演示页面
 * 展示流式 Markdown 渲染效果，带性能监控
 */
import { ref, reactive, nextTick, onMounted, onUnmounted } from 'vue'
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

// 性能指标
const perfMetrics = reactive({
  fps: 60,
  renderTime: 0,
  domNodes: 0,
  heapSize: 0,
  throughput: 0,
  eventListeners: 0,
  documents: 1,
  frames: 0,
  layoutsPerSec: 0,
  recalcsPerSec: 0
})

// 极值记录
const extremes = reactive({
  fpsMin: 60,
  fpsMax: 0,
  renderTimeMax: 0,
  domNodesMax: 0,
  heapSizeMax: 0,
  throughputMax: 0,
  eventListenersMax: 0,
  documentsMax: 1,
  framesMax: 0,
  layoutsPerSecMax: 0,
  recalcsPerSecMax: 0
})

// FPS 计算相关
let frameCount = 0
let lastFpsTime = performance.now()
let fpsRafId: number | null = null

// 吞吐量计算
let charCountStart = 0
let throughputStartTime = 0

// Layout/Recalc 计数器
let layoutCount = 0
let recalcCount = 0
let perfObserver: PerformanceObserver | null = null

/**
 * 统计事件监听器数量（估算）
 */
const countEventListeners = (): number => {
  let count = 0
  const elements = document.querySelectorAll('*')
  // 检查常见事件属性
  const eventProps = ['onclick', 'onmousedown', 'onmouseup', 'onmouseover', 'onmouseout', 
                      'onkeydown', 'onkeyup', 'onchange', 'oninput', 'onscroll', 'onsubmit']
  elements.forEach(el => {
    eventProps.forEach(prop => {
      if ((el as any)[prop]) count++
    })
  })
  // 加上通过 addEventListener 添加的（使用 Vue 组件数量估算）
  const vueComponents = document.querySelectorAll('[data-v-]')
  count += vueComponents.length * 2 // 估算每个组件约有2个监听器
  return count + 50 // 加上基础监听器
}

/**
 * 初始化 PerformanceObserver 监控布局和样式重计算
 */
const initPerfObserver = () => {
  // 监控 layout-shift（布局偏移，间接反映重排）
  try {
    perfObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'layout-shift') {
          layoutCount++
        }
        if (entry.entryType === 'longtask') {
          // 长任务通常伴随样式重计算
          recalcCount++
        }
      }
    })
    perfObserver.observe({ entryTypes: ['layout-shift', 'longtask'] })
  } catch {
    // 不支持的浏览器
  }
}

/**
 * 重置极值记录
 */
const resetExtremes = () => {
  extremes.fpsMin = 60
  extremes.fpsMax = 0
  extremes.renderTimeMax = 0
  extremes.domNodesMax = 0
  extremes.heapSizeMax = 0
  extremes.throughputMax = 0
  extremes.eventListenersMax = 0
  extremes.documentsMax = 1
  extremes.framesMax = 0
  extremes.layoutsPerSecMax = 0
  extremes.recalcsPerSecMax = 0
}

/**
 * 更新极值
 */
const updateExtremes = () => {
  // 只在流式渲染时记录极值
  if (!isStreaming.value) return
  
  // FPS 极值
  if (perfMetrics.fps > 0) {
    extremes.fpsMin = Math.min(extremes.fpsMin, perfMetrics.fps)
    extremes.fpsMax = Math.max(extremes.fpsMax, perfMetrics.fps)
  }
  
  // 渲染耗时最大值
  extremes.renderTimeMax = Math.max(extremes.renderTimeMax, perfMetrics.renderTime)
  
  // DOM 节点最大值
  extremes.domNodesMax = Math.max(extremes.domNodesMax, perfMetrics.domNodes)
  
  // 内存最大值
  extremes.heapSizeMax = Math.max(extremes.heapSizeMax, perfMetrics.heapSize)
  
  // 吞吐量最大值
  extremes.throughputMax = Math.max(extremes.throughputMax, perfMetrics.throughput)
  
  // 事件监听器最大值
  extremes.eventListenersMax = Math.max(extremes.eventListenersMax, perfMetrics.eventListeners)
  
  // Documents 最大值
  extremes.documentsMax = Math.max(extremes.documentsMax, perfMetrics.documents)
  
  // Frames 最大值
  extremes.framesMax = Math.max(extremes.framesMax, perfMetrics.frames)
  
  // Layouts/s 最大值
  extremes.layoutsPerSecMax = Math.max(extremes.layoutsPerSecMax, perfMetrics.layoutsPerSec)
  
  // Recalcs/s 最大值
  extremes.recalcsPerSecMax = Math.max(extremes.recalcsPerSecMax, perfMetrics.recalcsPerSec)
}

/**
 * 计算 FPS
 */
const measureFps = () => {
  frameCount++
  const now = performance.now()
  
  if (now - lastFpsTime >= 1000) {
    perfMetrics.fps = frameCount
    frameCount = 0
    lastFpsTime = now
    
    // 更新 Layouts/s 和 Recalcs/s
    perfMetrics.layoutsPerSec = layoutCount
    perfMetrics.recalcsPerSec = recalcCount
    layoutCount = 0
    recalcCount = 0
    
    // 更新其他指标和极值
    updateMetrics()
    updateExtremes()
  }
  
  fpsRafId = requestAnimationFrame(measureFps)
}

/**
 * 更新性能指标
 */
const updateMetrics = () => {
  // DOM 节点数
  perfMetrics.domNodes = document.getElementsByTagName('*').length
  
  // 内存使用（仅 Chrome 支持）
  const memory = (performance as any).memory
  if (memory) {
    perfMetrics.heapSize = memory.usedJSHeapSize / 1024 / 1024
  }
  
  // 事件监听器数量
  perfMetrics.eventListeners = countEventListeners()
  
  // Documents 数量（主文档 + iframe）
  perfMetrics.documents = document.querySelectorAll('iframe').length + 1
  
  // Frames 数量
  perfMetrics.frames = window.frames.length
  
  // 计算吞吐量
  if (isStreaming.value && throughputStartTime > 0) {
    const elapsed = (performance.now() - throughputStartTime) / 1000
    if (elapsed > 0) {
      perfMetrics.throughput = Math.round((displayContent.value.length - charCountStart) / elapsed)
    }
  } else {
    perfMetrics.throughput = 0
  }
}

/**
 * 开始流式渲染
 */
const startStreaming = () => {
  if (isStreaming.value) return
  
  // 重置内容和计数器
  displayContent.value = ''
  isStreaming.value = true
  scrollCounter = 0
  layoutCount = 0
  recalcCount = 0
  
  // 重置极值记录
  resetExtremes()
  
  // 重置吞吐量计算
  charCountStart = 0
  throughputStartTime = performance.now()
  
  let currentIndex = 0
  const totalLength = sampleMarkdown.length
  
  const streamNextChar = () => {
    if (currentIndex < totalLength) {
      const startTime = performance.now()
      
      // 每次添加一个字符
      displayContent.value = sampleMarkdown.slice(0, currentIndex + 1)
      currentIndex++
      scrollCounter++
      
      // 记录渲染耗时并更新极值
      nextTick(() => {
        perfMetrics.renderTime = performance.now() - startTime
        extremes.renderTimeMax = Math.max(extremes.renderTimeMax, perfMetrics.renderTime)
      })
      
      // 每 10 个字符滚动一次
      if (scrollCounter >= 10) {
        scrollCounter = 0
        nextTick(scrollToBottom)
      }
      
      streamTimer = setTimeout(streamNextChar, streamSpeed.value)
    } else {
      // 渲染完成
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
  perfMetrics.renderTime = 0
  perfMetrics.throughput = 0
  perfMetrics.layoutsPerSec = 0
  perfMetrics.recalcsPerSec = 0
  layoutCount = 0
  recalcCount = 0
  resetExtremes()
}

onMounted(() => {
  // 初始化性能观察器
  initPerfObserver()
  // 启动 FPS 监控
  measureFps()
})

onUnmounted(() => {
  if (fpsRafId) cancelAnimationFrame(fpsRafId)
  if (streamTimer) clearTimeout(streamTimer)
  if (perfObserver) perfObserver.disconnect()
})
</script>

<style lang="scss" scoped>
.demo-view {
  display: flex;
  min-height: 100vh;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

// 侧边性能监控面板
.perf-sidebar {
  position: fixed;
  right: 0;
  top: 0;
  width: 140px;
  height: 100vh;
  background: #1a1a2e;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-family: 'Monaco', 'Consolas', monospace;
  overflow-y: auto;
  z-index: 100;
  
  .perf-title {
    font-size: 0.7rem;
    color: #667eea;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 0.25rem;
    text-align: center;
  }
  
  .perf-item {
    display: flex;
    flex-direction: column;
    padding: 0.4rem 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
    
    &.warn {
      background: rgba(245, 87, 108, 0.2);
      
      .value {
        color: #f5576c;
      }
    }
    
    .label {
      font-size: 0.55rem;
      color: #888;
      text-transform: uppercase;
      margin-bottom: 0.1rem;
    }
    
    .value {
      font-size: 0.95rem;
      color: #4ade80;
      font-weight: 600;
    }
    
    .extremes {
      font-size: 0.5rem;
      color: #fbbf24;
      margin-top: 0.1rem;
    }
  }
}

// 主内容区
.demo-main {
  flex: 1;
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  padding-right: 160px; // 为侧边栏留出空间
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

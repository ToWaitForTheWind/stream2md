<template>
  <div class="md-content" v-html="renderedHtml"></div>
</template>

<script setup lang="ts">
/**
 * MDContentHtml - Markdown 内容渲染组件（v-html 版本）
 * 支持流式输入，实时渲染 Markdown 内容
 * 优化策略：流式渲染时使用轻量渲染，完成后再完整渲染
 */
import { ref, watch, onUnmounted } from 'vue';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

// 组件属性定义
interface Props {
  /** 流式渲染节流间隔（毫秒） */
  throttleInterval?: number;
}

const props = withDefaults(defineProps<Props>(), {
  throttleInterval: 100
});

// 双向绑定的 markdown 内容
const modelValue = defineModel<string>('modelValue', { default: '' });

// 渲染后的 HTML
const renderedHtml = ref('');

// 节流相关状态
let lastRenderTime = 0;
let pendingRender = false;
let rafId: number | null = null;
let lastContent = '';
let streamEndTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 创建 Markdown 解析器
 * @param enableHighlight 是否启用代码高亮
 */
const createMarkdownParser = (enableHighlight: boolean) => {
  return new MarkdownIt({
    html: true,
    highlight(str: string, lang: string): string {
      // 流式渲染时跳过高亮，直接返回纯代码
      if (!enableHighlight) {
        const escaped = str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<pre class="hljs"><code>${escaped}</code></pre>`;
      }
      
      if (lang && hljs.getLanguage(lang)) {
        try {
          return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang }).value}</code></pre>`;
        } catch {
          // 高亮失败时使用默认渲染
        }
      }
      return `<pre class="hljs"><code>${hljs.highlightAuto(str).value}</code></pre>`;
    }
  });
};

// 轻量解析器（无高亮）用于流式渲染
const mdLight = createMarkdownParser(false);
// 完整解析器（带高亮）用于最终渲染
const mdFull = createMarkdownParser(true);

const doRender = (content: string, useFullRender: boolean) => {
  if (!content) {
    renderedHtml.value = '';
    return;
  }
  
  // 选择解析器：流式用轻量，完成后用完整
  const md = useFullRender ? mdFull : mdLight;
  renderedHtml.value = md.render(content);
};

/**
 * 使用 requestAnimationFrame 进行节流渲染
 */
const scheduleRender = (content: string) => {
  const now = performance.now();
  
  // 检测是否在流式输入中
  if (streamEndTimer) {
    clearTimeout(streamEndTimer);
  }
  
  // 设置流式结束检测：200ms 无更新则认为流式结束
  streamEndTimer = setTimeout(() => {
    // 流式结束后进行完整渲染（带代码高亮）
    if (content) {
      doRender(content, true);
    }
  }, 200);
  
  lastContent = content;
  
  // 节流：距离上次渲染不足 interval 则跳过
  if (now - lastRenderTime < props.throttleInterval) {
    if (!pendingRender) {
      pendingRender = true;
      rafId = requestAnimationFrame(() => {
        pendingRender = false;
        lastRenderTime = performance.now();
        // 流式渲染使用轻量解析器
        doRender(lastContent, false);
      });
    }
    return;
  }
  
  lastRenderTime = now;
  // 流式渲染使用轻量解析器
  doRender(content, false);
};

// 监听内容变化
watch(modelValue, (newValue, oldValue) => {
  // 内容清空时立即渲染
  if (!newValue) {
    if (rafId) cancelAnimationFrame(rafId);
    if (streamEndTimer) clearTimeout(streamEndTimer);
    pendingRender = false;
    renderedHtml.value = '';
    return;
  }
  // 首次渲染或非流式更新（内容大幅变化）
  if (!oldValue || Math.abs(newValue.length - oldValue.length) > 100) {
    doRender(newValue, true);
    return;
  }
  // 流式更新
  scheduleRender(newValue);
}, { immediate: true });

// 组件卸载时清理
onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId);
  if (streamEndTimer) clearTimeout(streamEndTimer);
});
</script>

<style scoped lang="scss">
.md-content {
  line-height: 1.6;
  word-wrap: break-word;

  // 代码块样式
  :deep(pre.hljs) {
    padding: 1em;
    border-radius: 6px;
    overflow-x: auto;
    margin: 1em 0;
  }

  // 行内代码样式
  :deep(code:not(.hljs code)) {
    background-color: rgba(0, 0, 0, 0.05);
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-size: 0.9em;
  }

  // 链接样式
  :deep(a) {
    color: #0366d6;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  // 引用样式
  :deep(blockquote) {
    margin: 1em 0;
    padding: 0.5em 1em;
    border-left: 4px solid #ddd;
    color: #666;
    background-color: #f9f9f9;
  }

  // 图片样式
  :deep(img) {
    max-width: 100%;
    height: auto;
  }
}
</style>


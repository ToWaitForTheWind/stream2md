<template>
  <div class="md-content" ref="contentRef">
    <VNodeRenderer />
  </div>
</template>

<script setup lang="ts">
/**
 * MDContent - Markdown 内容渲染组件
 * 支持流式输入，实时渲染 Markdown 内容
 * 支持 Mermaid 图表语法
 * 优化策略：流式渲染时使用轻量渲染，完成后再完整渲染
 */
import { ref, watch, h, type VNode, Fragment, onUnmounted, nextTick } from 'vue';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import mermaid from 'mermaid';
import 'highlight.js/styles/atom-one-dark.css';

// 初始化 Mermaid 配置
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

// 子节点类型
type VNodeChild = VNode | string;

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

// 渲染后的 VNode
const contentVNode = ref<VNode>(h(Fragment));
// 容器 DOM 引用
const contentRef = ref<HTMLElement | null>(null);

// 节流相关状态
let lastRenderTime = 0;
let pendingRender = false;
let rafId: number | null = null;
let lastContent = '';
let streamEndTimer: ReturnType<typeof setTimeout> | null = null;
// Mermaid 图表 ID 计数器
let mermaidIdCounter = 0;

// 复用 DOMParser 实例
const domParser = new DOMParser();

/**
 * 创建 Markdown 解析器
 * @param enableHighlight 是否启用代码高亮
 */
const createMarkdownParser = (enableHighlight: boolean) => {
  return new MarkdownIt({
    html: true,
    highlight(str: string, lang: string): string {
      // Mermaid 代码块特殊处理
      if (lang === 'mermaid') {
        // 流式渲染时显示占位符
        if (!enableHighlight) {
          return `<div class="mermaid-placeholder"><pre><code>${str.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre></div>`;
        }
        // 完整渲染时生成 Mermaid 容器
        const id = `mermaid-${++mermaidIdCounter}`;
        return `<div class="mermaid-container" data-mermaid-id="${id}"><pre class="mermaid">${str}</pre></div>`;
      }
      
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

/**
 * 渲染 Mermaid 图表
 */
const renderMermaid = async () => {
  if (!contentRef.value) return;
  
  const mermaidElements = contentRef.value.querySelectorAll('.mermaid');
  if (mermaidElements.length === 0) return;
  
  try {
    await mermaid.run({
      nodes: mermaidElements as NodeListOf<HTMLElement>,
    });
  } catch (error) {
    console.warn('Mermaid 渲染失败:', error);
  }
};

/**
 * 将 HTML 字符串转换为 VNode 树
 */
const htmlToVNode = (html: string): VNode => {
  const doc = domParser.parseFromString(html, 'text/html');

  // 递归转换 DOM 元素为 VNode
  function convertNode(node: ChildNode): VNodeChild {
    // 文本节点直接返回文本内容
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    
    // 元素节点转换为 VNode
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const children = Array.from(element.childNodes).map(convertNode);

      // 提取元素属性
      const attrs: Record<string, string> = {};
      for (const attr of element.attributes) {
        attrs[attr.name] = attr.value;
      }

      return h(element.tagName.toLowerCase(), attrs, children);
    }
    
    return '';
  }

  // 将 body 的所有子节点转换为 Fragment
  const children = Array.from(doc.body.childNodes).map(convertNode);
  return h(Fragment, children);
};

const VNodeRenderer = () => contentVNode.value;

const doRender = (content: string, useFullRender: boolean) => {
  if (!content) {
    contentVNode.value = h(Fragment);
    return;
  }
  
  // 选择解析器：流式用轻量，完成后用完整
  const md = useFullRender ? mdFull : mdLight;
  const html = md.render(content);
  contentVNode.value = htmlToVNode(html);
  
  // 完整渲染时执行 Mermaid 渲染
  if (useFullRender) {
    nextTick(renderMermaid);
  }
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
    // 流式结束后进行完整渲染（带代码高亮和 Mermaid）
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
    contentVNode.value = h(Fragment);
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

  // Mermaid 容器样式
  :deep(.mermaid-container) {
    margin: 1em 0;
    
    .mermaid {
      background: #f8f9fa;
      padding: 1em;
      border-radius: 6px;
      overflow-x: auto;
    }
  }

  // Mermaid 占位符样式（流式渲染时）
  :deep(.mermaid-placeholder) {
    margin: 1em 0;
    padding: 1em;
    background: #f0f0f0;
    border-radius: 6px;
    border: 2px dashed #ccc;
    
    &::before {
      content: '📊 Mermaid 图表 (渲染中...)';
      display: block;
      color: #666;
      font-size: 0.85em;
      margin-bottom: 0.5em;
    }
    
    pre {
      margin: 0;
      background: transparent;
    }
    
    code {
      font-size: 0.85em;
      color: #555;
    }
  }
}
</style>

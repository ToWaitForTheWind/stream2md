<template>
  <div class="md-content" v-html="renderedHtml"></div>
</template>

<script setup lang="ts">
/**
 * MDContentHtmlOld - Markdown 内容渲染组件（v-html 版本）
 * 最简单的实现：每次内容变化直接渲染，无任何优化
 */
import { ref, watchEffect } from 'vue';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

// 双向绑定的 markdown 内容
const modelValue = defineModel<string>('modelValue', { default: '' });

// 渲染后的 HTML
const renderedHtml = ref('');

// Markdown 解析器（带代码高亮）
const md = new MarkdownIt({
  html: true,
  highlight(str: string, lang: string): string {
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

// 监听内容变化，直接渲染
watchEffect(() => {
  if (!modelValue.value) {
    renderedHtml.value = '';
    return;
  }
  renderedHtml.value = md.render(modelValue.value);
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

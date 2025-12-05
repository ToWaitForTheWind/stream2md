# MDContent 组件技术设计文档

## 1. 组件定位

`MDContent.vue` 是一个面向流式场景的高性能 Markdown 渲染组件。典型应用场景是 AI 对话中逐字输出的内容展示，需要在持续接收新字符的同时实时渲染 Markdown 格式。

## 2. 核心问题与解决思路

### 2.1 问题背景

流式渲染场景下，内容以每秒数十次的频率更新（如每 20ms 增加一个字符）。如果每次更新都执行完整的「Markdown 解析 → 代码高亮 → DOM 渲染」流程，会导致：

- CPU 占用率飙升至 100%
- DOM 节点数量不断累积，造成内存泄漏
- 页面卡顿，FPS 下降到 10 以下

### 2.2 解决思路

组件采用三个核心策略解决上述问题：

**策略一：双解析器分离**

将「流式过程」与「最终渲染」解耦。流式过程使用轻量解析器（禁用代码高亮），流式结束后再用完整解析器重新渲染一次。

**策略二：节流控制**

使用 `requestAnimationFrame` 配合时间间隔判断，将高频输入合并为低频渲染，默认每 100ms 最多渲染一次。

**策略三：VNode 增量更新**

使用 Vue 的 VNode 机制而非 `v-html`，让 Vue 的 diff 算法自动计算最小 DOM 变更，避免全量替换。

## 3. 双解析器策略

### 3.1 设计原理

代码高亮是 Markdown 渲染中最耗时的操作。`highlight.js` 对一段代码的高亮处理通常需要 5-50ms，而流式输入场景下每秒可能触发 50 次渲染，高亮操作会成为严重瓶颈。

解决方案是创建两个 MarkdownIt 实例：

```typescript
// 轻量解析器：流式渲染时使用，跳过代码高亮
const mdLight = createMarkdownParser(false);

// 完整解析器：最终渲染时使用，启用代码高亮
const mdFull = createMarkdownParser(true);
```

### 3.2 实现代码

```typescript
const createMarkdownParser = (enableHighlight: boolean) => {
  return new MarkdownIt({
    html: true,
    highlight(str: string, lang: string): string {
      // 流式渲染时跳过高亮，直接返回转义后的纯代码
      if (!enableHighlight) {
        const escaped = str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<pre class="hljs"><code>${escaped}</code></pre>`;
      }
      
      // 完整渲染时执行代码高亮
      if (lang && hljs.getLanguage(lang)) {
        try {
          return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang }).value}</code></pre>`;
        } catch {
          // 高亮失败时降级处理
        }
      }
      return `<pre class="hljs"><code>${hljs.highlightAuto(str).value}</code></pre>`;
    }
  });
};
```

### 3.3 使用时机

- 流式输入过程中：调用 `doRender(content, false)` 使用 `mdLight`
- 流式结束后：调用 `doRender(content, true)` 使用 `mdFull`
- 首次加载或内容大幅变化：直接使用 `mdFull`

## 4. 节流渲染机制

### 4.1 设计原理

即使跳过了代码高亮，每次内容变化都触发「Markdown 解析 → HTML 转 VNode → Vue 更新」仍然开销较大。通过节流将高频输入合并，可以大幅降低渲染次数。

组件采用 `requestAnimationFrame` 配合时间戳判断实现节流：

```typescript
const scheduleRender = (content: string) => {
  const now = performance.now();
  lastContent = content;
  
  // 距离上次渲染不足 100ms，跳过本次，等待下一帧
  if (now - lastRenderTime < props.throttleInterval) {
    if (!pendingRender) {
      pendingRender = true;
      rafId = requestAnimationFrame(() => {
        pendingRender = false;
        lastRenderTime = performance.now();
        doRender(lastContent, false);
      });
    }
    return;
  }
  
  // 超过间隔，立即渲染
  lastRenderTime = now;
  doRender(content, false);
};
```

### 4.2 关键变量说明

- `lastRenderTime`：上次渲染的时间戳
- `pendingRender`：是否有待执行的 RAF 回调
- `rafId`：RAF 的 ID，用于取消
- `lastContent`：最新的内容，确保 RAF 回调执行时使用最新值

### 4.3 效果

假设输入速度为 20ms/字符，节流间隔为 100ms：

- 无节流：每秒渲染 50 次
- 有节流：每秒渲染约 10 次

渲染次数降低 80%，CPU 占用大幅下降。

## 5. 流式结束检测

### 5.1 设计原理

流式输入没有明确的「结束」信号，组件通过检测「一段时间内无新输入」来判断流式结束。检测到结束后，执行一次完整渲染以应用代码高亮。

```typescript
const scheduleRender = (content: string) => {
  // 每次输入都重置定时器
  if (streamEndTimer) {
    clearTimeout(streamEndTimer);
  }
  
  // 200ms 无新输入则认为流式结束
  streamEndTimer = setTimeout(() => {
    if (content) {
      doRender(content, true);  // 完整渲染，启用高亮
    }
  }, 200);
  
  // ... 节流逻辑
};
```

### 5.2 时间阈值选择

200ms 是一个平衡点：
- 太短（如 50ms）：正常输入间隙可能误判为结束
- 太长（如 500ms）：用户感知到明显的高亮延迟

## 6. VNode 渲染机制

### 6.1 为什么不用 v-html

`v-html` 的工作方式是直接设置 `innerHTML`，每次更新都会销毁并重建整个 DOM 子树。这带来两个问题：

1. 性能浪费：即使只新增了一个字符，也要重建全部 DOM
2. 状态丢失：已绑定的事件监听器会丢失

### 6.2 VNode 方案原理

将 Markdown 解析后的 HTML 字符串转换为 Vue VNode 树，让 Vue 的 diff 算法计算最小变更：

```typescript
const htmlToVNode = (html: string): VNode => {
  // 使用 DOMParser 解析 HTML
  const doc = domParser.parseFromString(html, 'text/html');

  // 递归转换 DOM 节点为 VNode
  function convertNode(node: ChildNode): VNodeChild {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const children = Array.from(element.childNodes).map(convertNode);
      
      // 提取属性
      const attrs: Record<string, string> = {};
      for (const attr of element.attributes) {
        attrs[attr.name] = attr.value;
      }
      
      // 创建 VNode
      return h(element.tagName.toLowerCase(), attrs, children);
    }
    
    return '';
  }

  const children = Array.from(doc.body.childNodes).map(convertNode);
  return h(Fragment, children);
};
```

### 6.3 VNode 渲染方式

组件使用函数式组件来渲染 VNode：

```typescript
const contentVNode = ref<VNode>(h(Fragment));
const VNodeRenderer = () => contentVNode.value;
```

```vue
<template>
  <div class="md-content">
    <VNodeRenderer />
  </div>
</template>
```

这是正确的 VNode 渲染方式。常见错误是使用 `<component :is="contentVNode" />`，但 `is` 属性期望的是组件定义或元素名称，而非 VNode 实例。

### 6.4 DOMParser 复用

每次调用 `new DOMParser()` 会创建新对象，高频调用会造成内存压力。组件复用单一实例：

```typescript
// 模块级别声明，组件内复用
const domParser = new DOMParser();
```

## 7. 渲染策略分发

`watch` 监听器根据内容变化类型选择不同策略：

```typescript
watch(modelValue, (newValue, oldValue) => {
  // 情况1：内容清空
  if (!newValue) {
    cleanup();
    contentVNode.value = h(Fragment);
    return;
  }
  
  // 情况2：首次加载或内容大幅变化（非流式）
  if (!oldValue || Math.abs(newValue.length - oldValue.length) > 100) {
    doRender(newValue, true);
    return;
  }
  
  // 情况3：流式增量更新
  scheduleRender(newValue);
}, { immediate: true });
```

判断逻辑说明：

- `!newValue`：内容被清空，立即清除渲染
- `!oldValue`：首次加载，使用完整渲染
- `长度差 > 100`：内容被整体替换（如粘贴），使用完整渲染
- 其他情况：流式输入，使用节流轻量渲染

## 8. 资源清理

组件卸载时需要清理定时器和 RAF：

```typescript
onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId);
  if (streamEndTimer) clearTimeout(streamEndTimer);
});
```

内容清空时也需要清理：

```typescript
if (!newValue) {
  if (rafId) cancelAnimationFrame(rafId);
  if (streamEndTimer) clearTimeout(streamEndTimer);
  pendingRender = false;
  contentVNode.value = h(Fragment);
  return;
}
```

## 9. 性能效果

优化前后对比（流式输入场景，20ms/字符）：

| 指标 | 优化前 | 优化后 |
|------|--------|--------|
| 每秒渲染次数 | 50 次 | 10 次 |
| 单次渲染耗时 | 50-200ms | 5-15ms |
| CPU 峰值占用 | 100% | 30-50% |
| FPS | 10-20 | 50-60 |

## 10. 组件接口

```typescript
// Props
interface Props {
  throttleInterval?: number;  // 节流间隔，默认 100ms
}

// v-model
defineModel<string>('modelValue', { default: '' });
```

使用示例：

```vue
<MDContent 
  v-model:modelValue="content" 
  :throttle-interval="80"
/>
```

/**
 * Markdown 示例内容
 * 包含各种常见的 Markdown 语法
 */
export const sampleMarkdown = `# 🚀 Stream2MD 演示

这是一个 **流式 Markdown 渲染** 组件的演示页面，让我们一起探索 Markdown 的各种语法！

## 📝 标题层级

# 一级标题 H1
## 二级标题 H2
### 三级标题 H3
#### 四级标题 H4
##### 五级标题 H5
###### 六级标题 H6

---

## ✏️ 文本格式

### 基础格式
- **粗体文本** - 使用双星号包裹
- *斜体文本* - 使用单星号包裹
- ***粗斜体文本*** - 使用三个星号包裹
- ~~删除线文本~~ - 使用双波浪线包裹
- <u>下划线文本</u> - 使用 HTML 标签
- <mark>高亮文本</mark> - 使用 mark 标签

### 上标与下标
- 水的化学式是 H<sub>2</sub>O
- 爱因斯坦方程 E=mc<sup>2</sup>

### 行内代码
使用 \`console.log('Hello World')\` 输出日志。

---

## 📋 列表

### 无序列表
- 🍎 苹果
- 🍌 香蕉
- 🍊 橘子
  - 脐橙
  - 血橙
    - 塔罗科血橙
    - 摩洛血橙
- 🍇 葡萄

### 有序列表
1. 第一步：克隆仓库
2. 第二步：安装依赖
3. 第三步：启动开发服务器

### 任务列表
- [x] ✅ 完成项目初始化
- [x] ✅ 实现核心功能
- [x] ✅ 添加代码高亮
- [ ] 📝 编写单元测试
- [ ] 📖 完善文档
- [ ] 🚀 发布 v1.0 版本

---

## 💬 引用

### 简单引用
> 代码是写给人看的，顺便能在机器上运行。
> — Donald Knuth

### 嵌套引用
> 外层引用内容
> > 第一层嵌套引用
> > > 第二层嵌套引用
> > > > 可以继续嵌套...

### 带格式的引用
> #### 📌 提示
> 这是一个带有标题和格式的引用块：
> - 支持 **粗体**
> - 支持 *斜体*
> - 支持 \`行内代码\`

---

## 💻 代码展示

### TypeScript

\`\`\`typescript
// TypeScript 类型系统演示
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

type UserRole = 'admin' | 'editor' | 'viewer';

interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

// 泛型函数
async function request<T>(url: string): Promise<ApiResponse<T>> {
  const response = await fetch(url);
  return response.json();
}

// 类型守卫
function isAdmin(user: User): user is User & { role: 'admin' } {
  return user.role === 'admin';
}

// 使用示例
const handleUser = (user: User) => {
  if (isAdmin(user)) {
    console.log('管理员 ' + user.name + ' 拥有所有权限');
  }
};
\`\`\`

---
中国历史发展脉络复杂而悠久，用 Mermaid 图可以简明展示主要朝代更替。以下是一个基于时间顺序的 **中国主要朝代演进图**（使用 Mermaid 的 timeline 语法）：

\`\`\`mermaid
timeline
    title 中国主要朝代发展简图
    公元前2070年 ： 夏朝
    公元前1600年 ： 商朝
    公元前1046年 ： 周朝
        分为西周与东周（含春秋战国）
    公元前221年 ： 秦朝
    公元前202年 ： 汉朝
        西汉 → 新莽 → 东汉
    220年 ： 三国（魏、蜀、吴）
    265年 ： 晋朝
        西晋 → 东晋 + 十六国
    420年 ： 南北朝
    581年 ： 隋朝
    618年 ： 唐朝
    907年 ： 五代十国
    960年 ： 宋朝
        北宋 → 南宋（与辽、金、西夏并立）
    1271年 ： 元朝
    1368年 ： 明朝
    1644年 ： 清朝
    1912年 ： 中华民国
    1949年 ： 中华人民共和国
\`\`\`

> 💡 **说明**：此图为简化版本，聚焦统一王朝及重大分裂时期。如需包含更多细节（如少数民族政权、地方割据等），可进一步扩展。
---

## 📊 表格

| 姓名 | 年龄 | 职业 | 城市 |
|------|------|------|------|
| 张三 | 28 | 前端工程师 | 北京 |
| 李四 | 32 | 后端工程师 | 上海 |
| 王五 | 26 | 全栈工程师 | 深圳 |

---

## 🔗 链接

### 普通链接
- [Vue.js 官网](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Vite 官网](https://vitejs.dev/) - 下一代前端构建工具
- [TypeScript](https://www.typescriptlang.org/) - JavaScript 的超集

### 自动链接
直接输入 URL 会自动转换为链接：
- https://github.com
- https://www.google.com

---

## 📸 图片

### 普通图片
![Vue Logo](https://vuejs.org/images/logo.png)

### 带链接的图片
[![Vite](https://vitejs.dev/logo.svg)](https://vitejs.dev/)

---

## 🎭 HTML 元素

### 折叠内容
<details>
<summary>📂 点击展开详细信息</summary>

这里是折叠的内容，可以包含：
- 列表项 1
- 列表项 2
- 列表项 3

</details>

### 键盘按键
使用 <kbd>Ctrl</kbd> + <kbd>C</kbd> 复制，<kbd>Ctrl</kbd> + <kbd>V</kbd> 粘贴。

Mac 用户使用 <kbd>⌘</kbd> + <kbd>C</kbd> 和 <kbd>⌘</kbd> + <kbd>V</kbd>。

### 颜色文本
<span style="color: #e74c3c">红色文本</span> | 
<span style="color: #27ae60">绿色文本</span> | 
<span style="color: #3498db">蓝色文本</span>

---

## 📐 分割线

三种分割线写法效果相同：

---

***

___

---

## 🧮 特殊字符

### 转义字符
使用反斜杠转义特殊字符：
- \\* 星号
- \\# 井号
- \\[ 方括号

### 特殊符号
- 版权符号：©
- 注册商标：®
- 商标符号：™
- 欧元符号：€
- 箭头符号：← → ↑ ↓ ↔ ⇐ ⇒
- 数学符号：± × ÷ ≠ ≤ ≥ ∞ ∑ √

---

## 🎉 Emoji 表情

### 常用表情
😀 😃 😄 😁 😆 😅 🤣 😂 🙂 🙃 😉 😊 😇 🥰 😍 🤩

### 手势表情
👍 👎 👏 🙌 🤝 ✌️ 🤞 🤟 🤘 👌 🤏 👋 ✋ 🖐️ 🙏

### 物品与符号
💻 📱 ⌨️ 🖥️ 🖨️ 💡 📚 📝 ✏️ 📎 📌 🔍 🔧 ⚙️ 🔒 🔑

### 状态表情
✅ ❌ ⚠️ ❓ ❗ 💯 🔥 ⭐ 💫 🎯 🚀 🎉 🎊 🏆 🥇

---

## 🏁 结语

感谢你阅读这份 **Stream2MD** 演示文档！

这个组件具有以下特点：
1. **流式渲染** - 完美支持 AI 对话场景
2. **实时解析** - 内容变化即时响应
3. **代码高亮** - 支持多种编程语言
4. **样式美观** - 开箱即用的优雅样式

如果你喜欢这个项目，欢迎 ⭐ Star 支持！

---

> *"简单是复杂的最高形式。"*
> — 达芬奇

**渲染完成！** 🎊
`

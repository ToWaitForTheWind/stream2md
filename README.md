# stream2md

基于 Vue3 的插件项目。

## 技术栈

- Vue 3.5+
- TypeScript
- Vite
- SCSS

## 项目结构

```
stream2md/
├── src/
│   ├── components/      # 组件目录
│   ├── styles/          # 样式目录
│   │   ├── variables.scss   # SCSS 变量
│   │   └── main.scss        # 主样式
│   ├── index.ts         # 插件入口
│   └── main.ts          # 开发入口
├── vite.config.ts       # Vite 配置
└── package.json
```

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 类型检查
npm run type-check
```

## 构建

```bash
# 构建库
npm run build:lib
```

## 使用方式

### 全局安装

```typescript
import { createApp } from 'vue'
import Stream2md from 'stream2md'
import 'stream2md/style.css'

const app = createApp(App)
app.use(Stream2md)
```

### 按需引入

```typescript
import { HelloWorld } from 'stream2md'
import 'stream2md/style.css'
```

## License

MIT

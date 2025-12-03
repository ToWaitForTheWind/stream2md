/**
 * 开发环境入口
 * 用于本地开发和调试
 */
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// 引入主样式
import './styles/main.scss'

// 创建应用实例并挂载
const app = createApp(App)
app.use(router)
app.mount('#app')

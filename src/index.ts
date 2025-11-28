/**
 * stream2md 插件入口
 * Vue3 插件导出文件
 */
import type { App, Plugin } from 'vue'

// 导出组件
import HelloWorld from './components/HelloWorld.vue'

// 导出样式
import './styles/main.scss'

// 组件列表
const components = {
  HelloWorld
}

// 插件安装函数
const install: Plugin = {
  install(app: App) {
    // 注册所有组件
    Object.entries(components).forEach(([name, component]) => {
      app.component(name, component)
    })
  }
}

// 默认导出插件
export default install

// 按需导出组件
export { HelloWorld }


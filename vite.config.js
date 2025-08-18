import { defineConfig } from 'vite'

export default defineConfig({
  // 开发服务器配置
  server: {
    port: 3000,
    open: true
  },
  
  // 构建配置
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // 静态资源处理
    rollupOptions: {
      output: {
        // 资源文件命名
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/\.(mp3|wav|ogg)$/i.test(assetInfo.name)) {
            return `audio/[name].[ext]`
          }
          if (/\.(png|jpe?g|gif|svg|webp)$/i.test(assetInfo.name)) {
            return `images/[name].[ext]`
          }
          return `assets/[name]-[hash].[ext]`
        }
      }
    }
  },
  
  // 静态资源处理
  assetsInclude: ['**/*.mp3', '**/*.wav', '**/*.ogg']
})

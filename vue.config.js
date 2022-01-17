module.exports = {
  chainWebpack: config => {
    config.optimization.delete('splitChunks')
  },
  configureWebpack: {
    devtool: "inline-source-map"
  },
  pages: {
    popup: {
      template: 'public/browser-extension.html',
      entry: './src/popup/main.js',
      title: 'Popup'
    }
  },
  pluginOptions: {
    browserExtension: {
      componentOptions: {
        background: {
          entry: 'src/background.js'
        },
      }
    }
  }
}

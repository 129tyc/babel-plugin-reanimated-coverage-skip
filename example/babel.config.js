module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        node: 'current'
      }
    }]
  ],
  env: {
    test: {
      plugins: [
        // 1. 先执行 reanimated 插件，标记 worklet 函数
        ['babel-plugin-reanimated-coverage-skip', {
          addComments: true,
          onSkip: (info) => {
            console.log(`📊 跳过 ${info.functionsToSkip} 个 worklet 函数: ${info.filename}`);
          }
        }],
        // 2. 再执行 istanbul 插件，进行覆盖率插桩
        'babel-plugin-istanbul'
      ]
    }
  }
};

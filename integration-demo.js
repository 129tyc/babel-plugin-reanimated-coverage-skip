const babel = require('@babel/core');
const reanimatedPlugin = require('./lib/index.js').default;
const fs = require('fs');

// 读取测试文件
const code = fs.readFileSync('./fixtures/with-worklet.js', 'utf8');

console.log('🚀 演示 babel-plugin-reanimated-coverage-skip 与 babel-plugin-istanbul 的集成\n');

// 模拟 babel-plugin-istanbul 的简化版本（用于演示）
const mockIstanbulPlugin = function() {
  return {
    visitor: {
      Program: {
        enter(path) {
          const skipResult = path.node._skipCoverage;
          if (skipResult) {
            console.log('🚫 Istanbul: 整个文件被跳过，原因:', path.node._skipReason);
            return;
          }
        }
      },
      'FunctionDeclaration|FunctionExpression|ArrowFunctionExpression': {
        enter(path) {
          const skipResult = path.node._skipCoverage;
          if (skipResult) {
            console.log('⏭️  Istanbul: 跳过函数，原因:', path.node._skipReason);
            return;
          }
          
          // 模拟添加覆盖率代码（正常情况下会添加复杂的插桩代码）
          const functionName = path.node.id?.name || 'anonymous';
          console.log('📊 Istanbul: 为函数添加覆盖率插桩:', functionName);
        }
      }
    }
  };
};

console.log('=== 配置插件链 ===');
console.log('1. babel-plugin-reanimated-coverage-skip (先执行)');
console.log('2. babel-plugin-istanbul (后执行)\n');

// 转换代码
const result = babel.transformSync(code, {
  plugins: [
    // 1. 先执行 reanimated 插件，标记要跳过的函数
    [reanimatedPlugin, {
      addComments: true,
      onSkip: (info) => {
        console.log(`✅ Reanimated Plugin: 标记了 ${info.functionsToSkip} 个函数跳过覆盖率检测`);
      }
    }],
    // 2. 再执行 Istanbul 插件（这里用模拟版本演示）
    mockIstanbulPlugin
  ],
  filename: 'fixtures/with-worklet.js'
});

console.log('\n=== 最终结果 ===');
console.log('✅ 普通函数: normalFunction - 被正常插桩');
console.log('⏭️  Worklet函数: animationWorklet, useAnimatedStyleFunction 等 - 被跳过插桩');
console.log('🎯 效果: Worklet函数不会影响覆盖率统计，避免运行时错误\n');

const babel = require('@babel/core');
const plugin = require('./lib/index.js').default;
const fs = require('fs');

// Read the test file
const code = fs.readFileSync('./fixtures/with-worklet.js', 'utf8');

console.log('=== Original Code ===');
console.log(code);

console.log('\n=== Plugin Configuration ===');
const pluginOptions = {
  addComments: true,
  onSkip: (info) => {
    console.log(`📊 跳过统计: ${info.functionsToSkip}/${info.totalFunctions} 个函数被跳过`);
    console.log(`📁 文件: ${info.filename}`);
  }
};

// Transform the code
const result = babel.transformSync(code, {
  plugins: [[plugin, pluginOptions]],
  filename: 'fixtures/with-worklet.js'
});

console.log('\n=== Transformed Code ===');
console.log(result.code);

console.log('\n=== 检查 _skipCoverage 标记 ===');
const hasSkipMarker = result.code.includes('_skipCoverage');
console.log(`✅ _skipCoverage 标记存在: ${hasSkipMarker}`);

const hasIgnoreComment = result.code.includes('istanbul ignore next');
console.log(`✅ Istanbul ignore 注释存在: ${hasIgnoreComment}`);

# 使用指南

## 快速开始

### 1. 安装插件

```bash
npm install --dev babel-plugin-reanimated-coverage-skip
```

### 2. 配置 Babel

在 `babel.config.js` 中配置插件顺序：

```javascript
module.exports = {
  plugins: [
    'babel-plugin-reanimated-coverage-skip',  // 先执行
    'babel-plugin-istanbul'                   // 后执行
  ]
}
```

### 3. 运行覆盖率测试

```bash
# 使用 nyc
nyc mocha test/**/*.js

# 使用 jest
jest --coverage
```

## 配置选项

### 基础配置

```javascript
module.exports = {
  plugins: [
    ['babel-plugin-reanimated-coverage-skip', {
      // 是否需要导入 reanimated 才生效（默认: true）
      requireReanimatedImport: true,
      
      // 是否添加 istanbul ignore 注释（默认: true）
      addComments: true,
      
      // 跳过整个文件还是单个函数（默认: false）
      skipEntireFile: false
    }],
    'babel-plugin-istanbul'
  ]
}
```

### 高级配置

```javascript
module.exports = {
  plugins: [
    ['babel-plugin-reanimated-coverage-skip', {
      // 跳过时的回调函数
      onSkip: (info) => {
        console.log(`跳过了 ${info.functionsToSkip} 个 worklet 函数`);
        console.log(`文件: ${info.filename}`);
      }
    }],
    'babel-plugin-istanbul'
  ]
}
```

## 支持的检测模式

### 1. Worklet 指令检测

```javascript
function myAnimation() {
  'worklet';  // ✅ 会被跳过
  return Math.random();
}
```

### 2. Reanimated API 使用检测

```javascript
function useAnimatedComponent() {
  const value = useSharedValue(0);  // ✅ 会被跳过
  return useAnimatedStyle(() => ({
    opacity: value.value
  }));
}
```

### 3. 命名模式检测

```javascript
function myCustomWorklet() {     // ✅ 包含 'Worklet'
  return 'data';
}

function useAnimatedValue() {    // ✅ 包含 'Animated'
  return useSharedValue(0);
}

function panGesture() {          // ✅ 以 'Gesture' 结尾
  return 'handler';
}
```

## 与其他工具集成

### Jest 配置

```javascript
// jest.config.js
module.exports = {
  transform: {
    '^.+\\.jsx?$': ['babel-jest', {
      plugins: [
        'babel-plugin-reanimated-coverage-skip',
        'babel-plugin-istanbul'
      ]
    }]
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}'
  ]
}
```

### NYC 配置

```json
{
  "nyc": {
    "sourceMap": false,
    "instrument": false,
    "require": ["@babel/register"]
  }
}
```

## 最佳实践

### 1. 插件顺序很重要

```javascript
// ✅ 正确
plugins: [
  'babel-plugin-reanimated-coverage-skip',  // 先标记
  'babel-plugin-istanbul'                   // 后处理
]

// ❌ 错误
plugins: [
  'babel-plugin-istanbul',                  // 先处理了
  'babel-plugin-reanimated-coverage-skip'   // 标记太晚
]
```

### 2. 环境隔离

```javascript
module.exports = {
  env: {
    test: {
      plugins: [
        'babel-plugin-reanimated-coverage-skip',
        'babel-plugin-istanbul'
      ]
    },
    production: {
      plugins: [
        // 生产环境不需要覆盖率插件
      ]
    }
  }
}
```

### 3. 选择性启用

```javascript
// 只对包含 Reanimated 的文件生效
module.exports = {
  plugins: [
    ['babel-plugin-reanimated-coverage-skip', {
      requireReanimatedImport: true  // 默认值
    }],
    'babel-plugin-istanbul'
  ]
}
```

## 故障排除

### 问题：插件没有生效

**检查项：**
1. 插件顺序是否正确
2. 是否在正确的环境中配置
3. 文件是否导入了 `react-native-reanimated`

### 问题：仍然有覆盖率错误

**可能原因：**
1. 函数没有被正确识别为 worklet
2. 需要手动添加 `/* istanbul ignore next */` 注释

**解决方案：**
```javascript
// 手动添加注释
/* istanbul ignore next */
function mySpecialWorklet() {
  'worklet';
  return someValue;
}
```

### 问题：覆盖率报告不准确

**说明：**
- 跳过的函数不会出现在覆盖率统计中
- 这是预期行为，因为 worklet 函数无法正常测试覆盖率

## 调试模式

启用详细日志：

```javascript
module.exports = {
  plugins: [
    ['babel-plugin-reanimated-coverage-skip', {
      onSkip: (info) => {
        console.log('🚫 跳过覆盖率检测:');
        console.log(`   文件: ${info.filename}`);
        console.log(`   函数: ${info.functionsToSkip}/${info.totalFunctions}`);
      }
    }],
    'babel-plugin-istanbul'
  ]
}
```

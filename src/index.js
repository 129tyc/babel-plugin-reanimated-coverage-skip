import { declare } from '@babel/helper-plugin-utils'

/**
 * Check if a file imports react-native-reanimated
 * @param {Object} programPath - Babel program path
 * @returns {boolean}
 */
function hasReanimatedImport (programPath) {
  let hasImport = false

  programPath.traverse({
    ImportDeclaration (path) {
      const source = path.node.source.value
      if (source === 'react-native-reanimated' || source.includes('reanimated')) {
        hasImport = true
        path.stop()
      }
    },
    CallExpression (path) {
      // Check for require('react-native-reanimated')
      if (
        path.node.callee.type === 'Identifier' &&
        path.node.callee.name === 'require' &&
        path.node.arguments.length === 1 &&
        path.node.arguments[0].type === 'Literal'
      ) {
        const moduleName = path.node.arguments[0].value
        if (moduleName === 'react-native-reanimated' || moduleName.includes('reanimated')) {
          hasImport = true
          path.stop()
        }
      }
    }
  })

  return hasImport
}

/**
 * Check if a function contains worklet directive
 * @param {Object} functionPath - Babel function path
 * @returns {boolean}
 */
function isWorkletFunction (functionPath) {
  const body = functionPath.node.body
  if (!body || body.type !== 'BlockStatement' || !body.body) {
    return false
  }

  // Check for 'worklet' directive at the beginning of function body
  return body.body.some(
    (statement) =>
      statement.type === 'ExpressionStatement' &&
      statement.expression.type === 'Literal' &&
      statement.expression.value === 'worklet'
  )
}

/**
 * Check if a function is likely a Reanimated function based on patterns
 * @param {Object} functionPath - Babel function path
 * @returns {boolean}
 */
function isReanimatedFunction (functionPath) {
  // Check for worklet directive
  if (isWorkletFunction(functionPath)) {
    return true
  }

  // Check for common Reanimated patterns
  const functionName = functionPath.node.id && functionPath.node.id.name
  if (functionName) {
    // Common worklet naming patterns
    if (
      functionName.includes('Worklet') ||
      functionName.includes('Animated') ||
      functionName.endsWith('Gesture') ||
      functionName.startsWith('use') // React hooks that might be worklets
    ) {
      return true
    }
  }

  // Check for Reanimated API usage inside function
  let hasReanimatedApi = false
  functionPath.traverse({
    MemberExpression (path) {
      const object = path.node.object
      const property = path.node.property

      if (
        object.type === 'Identifier' &&
        property.type === 'Identifier'
      ) {
        // Check for common Reanimated APIs
        const reanimatedApis = [
          'runOnJS',
          'runOnUI',
          'useSharedValue',
          'useAnimatedStyle',
          'useAnimatedGestureHandler',
          'useAnimatedReaction',
          'withTiming',
          'withSpring',
          'withDecay',
          'cancelAnimation'
        ]

        if (reanimatedApis.includes(property.name)) {
          hasReanimatedApi = true
          path.stop()
        }
      }
    },
    CallExpression (path) {
      const callee = path.node.callee
      if (callee.type === 'Identifier') {
        // Direct calls to Reanimated functions
        const reanimatedFunctions = [
          'runOnJS',
          'runOnUI',
          'useSharedValue',
          'useAnimatedStyle',
          'useAnimatedGestureHandler',
          'useAnimatedReaction',
          'withTiming',
          'withSpring',
          'withDecay',
          'cancelAnimation'
        ]

        if (reanimatedFunctions.includes(callee.name)) {
          hasReanimatedApi = true
          path.stop()
        }
      }
    }
  })

  return hasReanimatedApi
}

/**
 * Mark functions with _skipCoverage flag
 * @param {Object} programPath - Babel program path
 * @param {Object} options - Plugin options
 */
function markReanimatedFunctions (programPath, options) {
  const { mode = 'function', skipEntireFile = false } = options

  // Count functions to skip
  let functionsToSkip = 0
  let totalFunctions = 0

  programPath.traverse({
    'FunctionDeclaration|FunctionExpression|ArrowFunctionExpression' (path) {
      totalFunctions++

      if (isReanimatedFunction(path)) {
        functionsToSkip++

        // Mark the function for skipping
        path.node._skipCoverage = true
        path.node._skipReason = 'reanimated worklet function'

        // Optionally add a comment for visibility
        if (options.addComments !== false) {
          const comment = path.node.leadingComments || []
          const hasSkipComment = comment.some(c =>
            c.value.includes('skip-coverage') ||
            c.value.includes('istanbul ignore')
          )

          if (!hasSkipComment) {
            if (!path.node.leadingComments) {
              path.node.leadingComments = []
            }
            path.node.leadingComments.push({
              type: 'CommentBlock',
              value: ' istanbul ignore next - reanimated worklet '
            })
          }
        }
      }
    }
  })

  // If skipEntireFile is true and we have worklet functions, skip the entire file
  if (skipEntireFile && functionsToSkip > 0) {
    programPath.node._skipCoverage = true
    programPath.node._skipReason = `contains ${functionsToSkip} reanimated worklet functions`
  }

  return {
    totalFunctions,
    functionsToSkip,
    skipEntireFile: skipEntireFile && functionsToSkip > 0
  }
}

export default declare((api, options) => {
  api.assertVersion(7)

  const {
    mode = 'function', // 'function' | 'file'
    skipEntireFile = false,
    requireReanimatedImport = true,
    addComments = true,
    onSkip = null
  } = options

  return {
    name: 'reanimated-coverage-skip',
    visitor: {
      Program: {
        enter (path) {
          // Skip if file doesn't import Reanimated (when required)
          if (requireReanimatedImport && !hasReanimatedImport(path)) {
            return
          }

          // Mark Reanimated functions for skipping
          const result = markReanimatedFunctions(path, {
            mode,
            skipEntireFile,
            addComments
          })

          // Call callback if provided
          if (onSkip && result.functionsToSkip > 0) {
            onSkip({
              filename: this.file.opts.filename,
              totalFunctions: result.totalFunctions,
              functionsToSkip: result.functionsToSkip,
              skipEntireFile: result.skipEntireFile
            })
          }
        }
      }
    }
  }
})

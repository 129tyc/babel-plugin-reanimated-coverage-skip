import { declare } from "@babel/helper-plugin-utils";
import { NodePath, PluginObj } from "@babel/core";
import * as t from "@babel/types";

/**
 * Check if a file imports react-native-reanimated
 */
function hasReanimatedImport(programPath: NodePath<t.Program>): boolean {
  let hasImport = false;

  programPath.traverse({
    ImportDeclaration(path) {
      const source = path.node.source.value;
      if (
        source === "react-native-reanimated" ||
        source.includes("reanimated")
      ) {
        hasImport = true;
        path.stop();
      }
    },
    CallExpression(path) {
      // Check for require('react-native-reanimated')
      if (
        path.node.callee.type === "Identifier" &&
        path.node.callee.name === "require" &&
        path.node.arguments.length === 1 &&
        path.node.arguments[0].type === "StringLiteral"
      ) {
        const moduleName = path.node.arguments[0].value;
        if (
          moduleName === "react-native-reanimated" ||
          moduleName.includes("reanimated")
        ) {
          hasImport = true;
          path.stop();
        }
      }
    },
  });

  return hasImport;
}

/**
 * Check if a function contains worklet directive
 */
function isWorkletFunction(functionPath: NodePath<t.Function>): boolean {
  const body = functionPath.node.body;
  if (!body || body.type !== "BlockStatement" || !body.body) {
    return false;
  }

  // Check for 'worklet' directive at the beginning of function body
  return body.body.some(
    (statement) =>
      statement.type === "ExpressionStatement" &&
      statement.expression.type === "StringLiteral" &&
      statement.expression.value === "worklet"
  );
}

/**
 * Check if the file contains any worklet functions
 */
function hasWorkletFunctions(programPath: NodePath<t.Program>): boolean {
  let hasWorklet = false;

  programPath.traverse({
    "FunctionDeclaration|FunctionExpression|ArrowFunctionExpression"(path) {
      if (isWorkletFunction(path as NodePath<t.Function>)) {
        hasWorklet = true;
        path.stop();
      }
    },
  });

  return hasWorklet;
}

export default declare((api): PluginObj => {
  api.assertVersion(7);

  return {
    name: "reanimated-coverage-skip",
    visitor: {
      Program: {
        enter(path) {
          // Check for programmatic skip coverage markers set by other plugins
          if ((path.node as any)._skipCoverage) {
            return;
          }

          // Check for file-level ignore comments
          const comments =
            (path.parent as any)?.comments || path.node.leadingComments || [];
          const hasFileIgnore = comments.some(
            (comment: any) =>
              comment.value.includes("istanbul ignore file") ||
              comment.value.includes("skip-coverage")
          );

          if (hasFileIgnore) {
            return;
          }

          // Skip entire file if it imports reanimated or contains worklet functions
          if (hasReanimatedImport(path) || hasWorkletFunctions(path)) {
            console.log("skipping file", this.file.opts.filename);
            // Set programmatic skip coverage markers
            (path.node as any)._skipCoverage = true;
            (path.node as any)._skipReason =
              "contains reanimated worklet functions";

            // Add istanbul ignore comment to skip entire file
            if (!path.node.leadingComments) {
              path.node.leadingComments = [];
            }
            path.node.leadingComments.unshift({
              type: "CommentBlock",
              value:
                " istanbul ignore file - contains reanimated worklet functions ",
            });
          }
        },
      },
    },
  };
});

import { declare } from "@babel/helper-plugin-utils";
import { NodePath, PluginObj } from "@babel/core";
import * as t from "@babel/types";

/**
 * Check if a file imports react-native-reanimated hooks
 */
function hasReanimatedImport(programPath: NodePath<t.Program>): boolean {
  let foundReanimated = false;

  programPath.traverse({
    ImportDeclaration(importPath) {
      if (importPath.node.source.value === "react-native-reanimated") {
        // Check if any imported specifier starts with "use"
        const hasUseHook = importPath.node.specifiers.some((specifier) => {
          return (
            specifier.type === "ImportSpecifier" &&
            specifier.imported.type === "Identifier" &&
            specifier.imported.name.startsWith("use")
          );
        });

        if (hasUseHook) {
          foundReanimated = true;
          importPath.stop();
        }
      }
    },
  });

  return foundReanimated;
}

/**
 * Check if the file contains any worklet functions
 */
function hasWorkletFunctions(programPath: NodePath<t.Program>): boolean {
  let foundWorklet = false;

  programPath.traverse({
    BlockStatement(blockPath) {
      if (
        blockPath.node.directives &&
        blockPath.node.directives.some(
          (directive) => directive.value.value === "worklet"
        )
      ) {
        foundWorklet = true;
        blockPath.stop();
      }
    },
  });

  return foundWorklet;
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

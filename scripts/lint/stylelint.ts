import type { WalkEntry } from "@std/fs";
import { REPO_ROOT } from "@/constants.ts";

import * as color from "@std/fmt/colors";
import * as path from "@std/path";

import "postcss-less";
import stylelint from "stylelint";
import "stylelint-config-standard";
import "stylelint-config-recommended";

import { log } from "@/logger.ts";

export async function lint(
  entry: WalkEntry,
  content: string,
  fix: boolean,
  config: stylelint.Config,
) {
  const { results, code } = await stylelint.lint({
    code: content,
    config,
    fix,
  });

  if (code) {
    Deno.writeTextFileSync(entry.path, code);
  }

  for (const result of results) {
    for (const warning of result.warnings) {
      // Some cleanup for fancier logging - dims the rule name.
      const message = warning.text?.replace(
        new RegExp(`\\(?${warning.rule}\\)?`),
        color.dim(`(${warning.rule})`),
      ) ?? "unspecified stylelint error";

      log.log(message, {
        file: path.relative(REPO_ROOT, entry.path),
        startLine: warning.line,
        endLine: warning.endLine,
        startColumn: warning.column,
        endColumn: warning.endColumn,
        content,
      }, warning.severity);
    }

    if (result.warnings.length > 0) throw new Error("stylelint error");
  }
}

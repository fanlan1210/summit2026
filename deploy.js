#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const repoRoot = process.cwd();
const distDir = resolve(repoRoot, "dist");
const checkoutDir = resolve(repoRoot, "_public");
const workflowSourcePath = resolve(repoRoot, ".github", "workflows", "production.yml");
const workflowTargetDir = resolve(checkoutDir, ".github", "workflows");
const workflowTargetPath = resolve(workflowTargetDir, "production.yml");
const removeOptions = { recursive: true, force: true, maxRetries: 10, retryDelay: 200 };

function run(command, args, options = {}) {
  execFileSync(command, args, {
    stdio: "inherit",
    cwd: repoRoot,
    ...options,
  });
}

function gitOutput(args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
  }).trim();
}

function runNpm(args) {
  if (process.platform === "win32") {
    const shell = process.env.ComSpec ?? "cmd.exe";
    run(shell, ["/d", "/s", "/c", "npm.cmd", ...args]);
    return;
  }

  run("npm", args);
}

function ensureGitRepo() {
  try {
    const isWorkTree = gitOutput(["rev-parse", "--is-inside-work-tree"]);

    if (isWorkTree === "true") {
      return;
    }
  } catch {
    // Fall through to the user-facing error below.
  }

  if (!existsSync(resolve(repoRoot, ".git"))) {
    console.error("please use deploy under a git repo.");
    process.exit(1);
  }
}

function removePath(path) {
  rmSync(path, removeOptions);
}

function replaceCheckoutWithDist() {
  const checkoutEntries = readdirSync(checkoutDir);

  for (const entry of checkoutEntries) {
    if (entry === ".git") {
      continue;
    }

    removePath(join(checkoutDir, entry));
  }

  for (const entry of readdirSync(distDir)) {
    cpSync(join(distDir, entry), join(checkoutDir, entry), { recursive: true });
  }

  if (existsSync(workflowSourcePath)) {
    mkdirSync(workflowTargetDir, { recursive: true });
    cpSync(workflowSourcePath, workflowTargetPath);
  }
}

ensureGitRepo();

const revision = gitOutput(["describe", "--always"]);
const remoteUrl = gitOutput(["remote", "get-url", "origin"]);

runNpm(["run", "fetch-schedule"]);
runNpm(["run", "convert-staff"]);
runNpm(["run", "build-production"]);

removePath(checkoutDir);

try {
  run("git", ["clone", remoteUrl, "--depth", "1", "-b", "production", checkoutDir]);
  replaceCheckoutWithDist();
  run("git", ["add", "--all"], { cwd: checkoutDir });
  run("git", ["commit", "-m", `regen for ${revision}`], { cwd: checkoutDir });
  run("git", ["push"], { cwd: checkoutDir });
} finally {
  removePath(checkoutDir);
}

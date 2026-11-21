#!/usr/bin/env node
// Restyle guard: proves a restyle changed looks only.
//
// For every .ts/.tsx file that differs from the base ref, the file is parsed
// before and after, every styling string is blanked, and the two results are
// compared. If anything else differs (an element, a handler, a prop, a hook,
// a data call), the file is reported.
//
// Styling strings are: the value of a `className`-like JSX attribute; any
// string held in a variable, property or parameter whose name ends in
// "class", "className", "classes" or "classNames" (or is `cls`); and any
// string inside a function whose name ends the same way.
//
// Usage:
//   node tools/restyle-guard.mjs [--base <ref>] [--allow-layout <file,...>] [--only <path prefix,...>]
//
// The working tree is compared with the base ref, so it can run before a commit.
//
// Exit code 0 = restyle only. Exit code 1 = something else changed.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import ts from 'typescript'

const args = process.argv.slice(2)
const option = (name, fallback) => {
  const index = args.indexOf(name)
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback
}
const base = option('--base', 'origin/codex/stabilisation-baseline')
const allowLayout = new Set(
  option('--allow-layout', '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean),
)

// Paths a restyle may never touch.
const PROTECTED = [
  /^src\/features\/[^/]+\/(api|hooks|lib)\//,
  /^src\/shared\/(lib|context)\//,
  /^src\/app\/routes\/AppRoutes\.tsx$/,
  /^(backend|workers|scripts|\.github)\//,
]
// Non-code paths a restyle may touch freely.
const FREE = [
  /^tailwind\.config\.js$/,
  /^src\/shared\/styles\//,
  /^src\/assets\//,
  /^public\//,
  /^index\.html$/,
  /^tools\//,
  /^docs\//,
  /^package(-lock)?\.json$/,
]

const git = (...gitArgs) =>
  execFileSync('git', gitArgs, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
const show = (ref, file) => {
  try {
    return git('show', `${ref}:${file}`)
  } catch {
    return null
  }
}

// `variant` picks one of a shared part's looks (for example Button), so it counts as styling.
const STYLE_NAME = /(^class$|^cls$|class(name)?s?$|classes$|^variant$)/i
// Some files keep class strings under other names (for example `tierColor`).
// tools/restyle-guard.styles.json lists those names per file, so that they
// count as styling in that file only.
const extraStyleNames = existsSync('tools/restyle-guard.styles.json')
  ? JSON.parse(readFileSync('tools/restyle-guard.styles.json', 'utf8'))
  : {}
let currentExtra = new Set()
const isStyleName = (name) => Boolean(name) && (STYLE_NAME.test(name) || currentExtra.has(name))

function normalise(source, fileName) {
  currentExtra = new Set(extraStyleNames[fileName] ?? [])
  const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const edits = []
  const blank = (node) => {
    // Blank every string and template chunk inside a styling expression.
    const visit = (child) => {
      if (ts.isStringLiteral(child) || ts.isNoSubstitutionTemplateLiteral(child)) {
        edits.push([child.getStart(file), child.getEnd(), "''"])
        return
      }
      if (ts.isTemplateHead(child) || ts.isTemplateMiddle(child) || ts.isTemplateTail(child)) {
        const text = child.getText(file)
        const open = ts.isTemplateHead(child) ? '`' : '}'
        const close = ts.isTemplateTail(child) ? '`' : '${'
        edits.push([child.getStart(file), child.getEnd(), open + close])
        if (text.length === 0) return
        return
      }
      ts.forEachChild(child, visit)
    }
    visit(node)
  }
  const walk = (node) => {
    if (ts.isJsxAttribute(node) && isStyleName(node.name.getText(file)) && node.initializer) {
      blank(node.initializer)
      return
    }
    if (
      (ts.isVariableDeclaration(node) || ts.isPropertyAssignment(node) || ts.isParameter(node)) &&
      node.initializer &&
      isStyleName(node.name.getText(file).replace(/['"]/g, ''))
    ) {
      blank(node.initializer)
      return
    }
    // A helper that only returns class strings, for example
    // `function statusClassName(status) { ... return 'bg-...' }`.
    if (ts.isFunctionDeclaration(node) && node.name && node.body && isStyleName(node.name.getText(file))) {
      blank(node.body)
      return
    }
    ts.forEachChild(node, walk)
  }
  walk(file)
  edits.sort((a, b) => b[0] - a[0])
  let output = source
  for (const [start, end, replacement] of edits) {
    output = output.slice(0, start) + replacement + output.slice(end)
  }
  // Re-print so that line breaks and spacing do not count as changes.
  const printed = ts
    .createPrinter({ removeComments: false })
    .printFile(ts.createSourceFile(fileName, output, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX))
  return printed
}

const changed = git('diff', '--name-status', '--no-renames', base, '--')
  .split('\n')
  .filter(Boolean)
  .map((line) => {
    const [status, ...rest] = line.split('\t')
    return { status, file: rest.join('\t') }
  })

const only = option('--only', '')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean)
const inScope = (file) => only.length === 0 || only.some((prefix) => file.startsWith(prefix))

const problems = []
const layout = []
let checked = 0

for (const { status, file } of changed) {
  if (!inScope(file)) continue
  if (PROTECTED.some((pattern) => pattern.test(file))) {
    problems.push(`${file}: protected path, a restyle must not touch it`)
    continue
  }
  if (FREE.some((pattern) => pattern.test(file))) continue
  if (!/\.(ts|tsx)$/.test(file)) {
    problems.push(`${file}: not on the "may change" list`)
    continue
  }
  if (allowLayout.has(file)) {
    layout.push(file)
    continue
  }
  if (status !== 'M') {
    problems.push(`${file}: file was ${status === 'A' ? 'added' : 'removed'}`)
    continue
  }
  const before = show(base, file)
  const after = existsSync(file) ? readFileSync(file, 'utf8') : ''
  checked += 1
  if (before === null) continue
  if (normalise(before, file) !== normalise(after, file)) {
    problems.push(`${file}: something other than styling changed`)
  }
}

console.log(`restyle-guard: base ${base}`)
console.log(`restyle-guard: ${changed.length} files differ, ${checked} code files compared`)
for (const file of layout) console.log(`  layout change, reviewed by hand: ${file}`)
if (problems.length > 0) {
  console.log(`restyle-guard: FAILED (${problems.length})`)
  for (const problem of problems) console.log(`  ${problem}`)
  process.exit(1)
}
console.log('restyle-guard: passed. Only styling changed.')

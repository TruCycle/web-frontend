#!/usr/bin/env node
// Palette check: lists colours in class names that are not TruCycle tokens.
//
// Reports (1) hard-coded hex colours such as `bg-[#0B3322]`, and (2) Tailwind
// colour families that are not part of the palette (sky, violet, blue ...).
// Amber is allowed: it is the "claimed" status colour.
//
// Usage: node tools/palette-check.mjs [path ...]   (default: src)
// Exit code 0 = clean. Exit code 1 = off-palette colours found.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const roots = process.argv.slice(2)
if (roots.length === 0) roots.push('src')

const HEX = /[a-z-]+-\[#[0-9a-fA-F]{3,8}\]/g
const FAMILY =
  /\b(?:bg|text|border|ring|from|to|via|divide|placeholder|fill|stroke|outline|decoration|shadow|accent|caret)-(?:sky|blue|indigo|violet|purple|fuchsia|pink|cyan|teal|yellow|orange|stone)-\d{2,3}\b/g

const files = []
const collect = (path) => {
  const stats = statSync(path)
  if (stats.isDirectory()) {
    for (const entry of readdirSync(path)) collect(join(path, entry))
  } else if (/\.(tsx|ts)$/.test(path)) {
    files.push(path)
  }
}
roots.forEach(collect)

let total = 0
for (const file of files.sort()) {
  const source = readFileSync(file, 'utf8')
  const found = [...(source.match(HEX) ?? []), ...(source.match(FAMILY) ?? [])]
  if (found.length === 0) continue
  total += found.length
  const counts = new Map()
  for (const entry of found) counts.set(entry, (counts.get(entry) ?? 0) + 1)
  console.log(`${file} (${found.length})`)
  for (const [entry, count] of counts) console.log(`  ${count} x ${entry}`)
}
console.log(total === 0 ? 'palette-check: clean.' : `palette-check: ${total} off-palette colours.`)
process.exit(total === 0 ? 0 : 1)

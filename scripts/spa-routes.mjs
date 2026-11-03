import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

export function extractSpaRoutes(source) {
  const tree = ts.createSourceFile('AppRoutes.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const routes = new Set()
  function visit(node) {
    if ((ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) && node.tagName.getText(tree) === 'Route') {
      const attribute = node.attributes.properties.find(value => ts.isJsxAttribute(value) && value.name.getText(tree) === 'path')
      if (attribute) {
        if (!attribute.initializer || !ts.isStringLiteral(attribute.initializer)) throw Error('Worker route inventory requires explicit string paths')
        const route = attribute.initializer.text
        if (route !== '*') {
          if (!route.startsWith('/') || /[?#\\*]/.test(route)) throw Error('Worker route inventory requires absolute route paths')
          routes.add(route)
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(tree)
  if (!routes.has('/')) throw Error('Missing root route in SPA inventory')
  return [...routes].sort()
}

export function writeSpaRoutes(root) {
  const routes = extractSpaRoutes(readFileSync(path.join(root, 'src/app/routes/AppRoutes.tsx'), 'utf8'))
  writeFileSync(path.join(root, 'workers/staging-web/routes.generated.js'), '// Generated from AppRoutes.tsx by scripts/spa-routes.mjs.\nexport default ' + JSON.stringify(routes, null, 2) + '\n')
  return routes
}

import { readFileSync } from 'node:fs'
import path from 'node:path'

const read = (file: string) => readFileSync(path.join(process.cwd(), file), 'utf8')

/** Every `styles.foo` a component reads. */
export function classesUsed(file: string): string[] {
  const names = [...read(file).matchAll(/\bstyles\.([A-Za-z_][A-Za-z0-9_]*)/g)].map((m) => m[1])
  return [...new Set(names)].sort()
}

/** Every `.foo` class selector a CSS module defines (comments ignored). */
export function classesDefined(cssFile: string): Set<string> {
  const css = read(cssFile).replace(/\/\*[\s\S]*?\*\//g, '')
  return new Set([...css.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)/g)].map((m) => m[1]))
}

/** Classes a component reads that its CSS module does not define. */
export function missingClasses(component: string, cssModule: string): string[] {
  const defined = classesDefined(cssModule)
  return classesUsed(component).filter((name) => !defined.has(name))
}

/** The module path a file imports as `styles`, or null. */
export function stylesImport(file: string): string | null {
  const match = /import styles from '([^']+)'/.exec(read(file))
  return match ? match[1] : null
}

/** Custom properties a stylesheet reads that are not v2 tokens. */
export function nonV2Vars(cssFile: string): string[] {
  const names = [...read(cssFile).matchAll(/var\((--[A-Za-z0-9-]+)/g)].map((m) => m[1])
  return [...new Set(names)].filter((name) => !/^--(c|f|fs|s|r|l|m)-/.test(name))
}

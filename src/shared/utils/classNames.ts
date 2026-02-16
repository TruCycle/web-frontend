type ClassToken = string | false | null | undefined

export function classNames(...tokens: ClassToken[]): string {
  return tokens.filter((token): token is string => Boolean(token)).join(' ')
}

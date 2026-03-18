import 'server-only'

const dictionaries: Record<string, () => Promise<any>> = {
  en: () => import('../dictionaries/en.json').then((module) => module.default),
  ka: () => import('../dictionaries/ka.json').then((module) => module.default),
}

export const getDictionary = async (locale: string) => {
  return dictionaries[locale]?.() ?? dictionaries.ka() // ka is default
}

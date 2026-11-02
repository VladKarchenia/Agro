import { buildSearchIndex, type SearchIndex } from '../utils/search'
import { getAllProducts, getAllSubcategories } from './catalog'

let index: SearchIndex | undefined

/** Индекс строится один раз при первом поиске, а не при загрузке страницы */
export function getSearchIndex(): SearchIndex {
  index ??= buildSearchIndex(getAllSubcategories(), getAllProducts())
  return index
}

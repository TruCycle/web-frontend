import type { FoundItemCategory } from '../types'
import type { ClassificationResult } from './imageClassifier'

export interface CatalogHint {
  readonly category: FoundItemCategory
  readonly keyword: string
  readonly displayLabel: string
  readonly confidence: number
}

interface LabelRule {
  readonly match: RegExp
  readonly category: FoundItemCategory
  readonly keyword: string
  readonly displayLabel: string
}

// Ordered most-specific-first. MobileNet labels often arrive comma-joined
// (e.g. "studio couch, day bed") so a single match wins for the whole string.
const LABEL_RULES: readonly LabelRule[] = [
  // Furniture
  { match: /\b(rocking|swivel|barber|folding|office)? ?chair\b/i, category: 'furniture', keyword: 'chair', displayLabel: 'Chair' },
  { match: /\b(studio couch|day bed|sofa|loveseat|settee)\b/i, category: 'furniture', keyword: 'sofa', displayLabel: 'Sofa' },
  { match: /\b(four[- ]poster|crib|bed)\b/i, category: 'furniture', keyword: 'bed', displayLabel: 'Bed' },
  { match: /\b(dining|coffee|desk|table)\b/i, category: 'furniture', keyword: 'table', displayLabel: 'Table' },
  { match: /\b(wardrobe|chiffonier|chest|cabinet|bookcase|file)\b/i, category: 'furniture', keyword: 'cabinet', displayLabel: 'Cabinet' },
  { match: /\b(lamp|chandelier|table lamp)\b/i, category: 'furniture', keyword: 'lamp', displayLabel: 'Lamp' },
  { match: /\b(mirror|picture frame)\b/i, category: 'furniture', keyword: 'mirror', displayLabel: 'Mirror' },

  // Appliances
  { match: /\b(washer|washing machine|dishwasher|dryer)\b/i, category: 'appliances', keyword: 'washing machine', displayLabel: 'Washing machine' },
  { match: /\b(refrigerator|fridge)\b/i, category: 'appliances', keyword: 'fridge', displayLabel: 'Fridge' },
  { match: /\b(microwave|oven|stove|toaster|kettle|coffee ?maker|espresso)\b/i, category: 'appliances', keyword: 'microwave', displayLabel: 'Small kitchen appliance' },
  { match: /\b(vacuum|hair drier|hair dryer|iron|fan|heater)\b/i, category: 'appliances', keyword: 'vacuum', displayLabel: 'Small appliance' },

  // Electronics
  { match: /\b(laptop|notebook computer|netbook)\b/i, category: 'electronics', keyword: 'laptop', displayLabel: 'Laptop' },
  { match: /\b(desktop computer|monitor|screen|crt screen|projector)\b/i, category: 'electronics', keyword: 'monitor', displayLabel: 'Monitor' },
  { match: /\b(cellular telephone|cell phone|mobile phone|smartphone|iPod|hand-held computer)\b/i, category: 'electronics', keyword: 'phone', displayLabel: 'Phone' },
  { match: /\b(television|tv|home theater)\b/i, category: 'electronics', keyword: 'television', displayLabel: 'Television' },
  { match: /\b(printer|scanner|fax|photocopier)\b/i, category: 'electronics', keyword: 'printer', displayLabel: 'Printer' },
  { match: /\b(speaker|loudspeaker|microphone|amplifier|stereo|radio|cassette)\b/i, category: 'electronics', keyword: 'speaker', displayLabel: 'Audio device' },
  { match: /\b(camera|reflex camera|polaroid|camcorder)\b/i, category: 'electronics', keyword: 'camera', displayLabel: 'Camera' },
  { match: /\b(joystick|computer keyboard|mouse|remote control)\b/i, category: 'electronics', keyword: 'keyboard', displayLabel: 'Computer accessory' },

  // Clothing
  { match: /\b(jersey|t[- ]?shirt|sweatshirt|hoodie|jumper|cardigan|sweater)\b/i, category: 'clothing', keyword: 'shirt', displayLabel: 'Top' },
  { match: /\b(suit|tuxedo|kimono|gown|robe|abaya|jean|pant|trouser|jeans)\b/i, category: 'clothing', keyword: 'trousers', displayLabel: 'Trousers' },
  { match: /\b(coat|trench|fur|overcoat|jacket|parka|windbreaker|cloak)\b/i, category: 'clothing', keyword: 'coat', displayLabel: 'Coat' },
  { match: /\b(shoe|boot|sneaker|loafer|sandal|clog|running shoe|cowboy boot)\b/i, category: 'clothing', keyword: 'shoes', displayLabel: 'Shoes' },
  { match: /\b(hat|cap|bonnet|sombrero|helmet|turban|crash helmet)\b/i, category: 'clothing', keyword: 'hat', displayLabel: 'Hat' },
  { match: /\b(handbag|purse|backpack|wallet|tote)\b/i, category: 'clothing', keyword: 'bag', displayLabel: 'Bag' },

  // Books / paper
  { match: /\b(book jacket|hardback|paperback|notebook(?! computer)|comic book|menu)\b/i, category: 'books', keyword: 'book', displayLabel: 'Book' },

  // Toys
  { match: /\b(teddy|toy|doll|teddy bear|puzzle|jigsaw|jack[- ]o'?[- ]lantern|rubik|abacus)\b/i, category: 'toys', keyword: 'toy', displayLabel: 'Toy' },
  { match: /\b(tricycle|unicycle|swing|seesaw|playground)\b/i, category: 'toys', keyword: 'tricycle', displayLabel: 'Outdoor toy' },

  // Outdoor / sports
  { match: /\b(bicycle|mountain bike|tandem|moped|motor scooter)\b/i, category: 'outdoor', keyword: 'bicycle', displayLabel: 'Bicycle' },
  { match: /\b(tent|sleeping bag|backpack|hiking|paddle|canoe|kayak|surfboard|skateboard|snowboard|ski|sled|barbecue|lawn ?mower|garden|wheelbarrow|shovel|rake|hoe)\b/i, category: 'outdoor', keyword: 'garden', displayLabel: 'Outdoor / garden' },

  // Generic fallbacks
  { match: /\b(box|carton|crate|barrel|drum|bottle|jar)\b/i, category: 'other', keyword: '', displayLabel: 'Container' },
]

const CATEGORY_PRIORITY: readonly FoundItemCategory[] = [
  'furniture',
  'appliances',
  'electronics',
  'clothing',
  'outdoor',
  'toys',
  'books',
  'other',
]

/**
 * Pick a catalog hint from MobileNet predictions.
 *
 * Strategy: walk predictions top-down; the first prediction that matches a
 * known rule wins, weighted by its model probability. Fall back to the
 * highest-probability label if no rule matches.
 */
export function predictionsToCatalogHint(
  predictions: readonly { className: string; probability: number }[],
): CatalogHint | null {
  if (predictions.length === 0) {
    return null
  }

  for (const prediction of predictions) {
    for (const rule of LABEL_RULES) {
      if (rule.match.test(prediction.className)) {
        return {
          category: rule.category,
          keyword: rule.keyword,
          displayLabel: rule.displayLabel,
          confidence: prediction.probability,
        }
      }
    }
  }

  // Nothing matched — give the donor a generic "other" hint sourced from the
  // first comma-separated token of the top label so the catalog search still
  // has something to chew on.
  const top = predictions[0]
  const firstWord = top.className.split(',')[0]?.trim() ?? ''
  return {
    category: 'other',
    keyword: firstWord,
    displayLabel: firstWord ? firstWord.charAt(0).toUpperCase() + firstWord.slice(1) : 'Other item',
    confidence: top.probability,
  }
}

/** Stable sort helper for UI so the chip ordering matches CATEGORY_PRIORITY. */
export function categorySortIndex(category: FoundItemCategory): number {
  const index = CATEGORY_PRIORITY.indexOf(category)
  return index === -1 ? CATEGORY_PRIORITY.length : index
}

/** Minimum confidence below which we should NOT auto-pick a hint. */
export const MIN_HINT_CONFIDENCE = 0.18

/** Returns the hint only if it crosses the confidence threshold. */
export function pickConfidentHint(
  predictions: readonly ClassificationResult[],
): CatalogHint | null {
  const hint = predictionsToCatalogHint(predictions)
  if (!hint) return null
  return hint.confidence >= MIN_HINT_CONFIDENCE ? hint : null
}

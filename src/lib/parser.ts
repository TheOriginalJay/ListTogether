import type { ParsedItem } from '@/types';

// Category keywords for auto-detection
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Produce: ['apple', 'banana', 'orange', 'grape', 'berry', 'strawberry', 'blueberry', 'raspberry', 'lettuce', 'spinach', 'kale', 'salad', 'carrot', 'potato', 'tomato', 'onion', 'garlic', 'pepper', 'broccoli', 'cauliflower', 'cucumber', 'zucchini', 'squash', 'corn', 'celery', 'asparagus', 'mushroom', 'avocado', 'lemon', 'lime', 'melon', 'watermelon', 'pineapple', 'mango', 'peach', 'pear', 'cherry', 'plum', 'kiwi', 'cabbage', 'radish', 'beet', 'turnip', 'parsnip', 'yam', 'sweet potato', 'green bean', 'pea', 'sprout', 'herb', 'basil', 'cilantro', 'parsley', 'mint', 'ginger'],
  Dairy: ['milk', 'cheese', 'butter', 'yogurt', 'cream', 'sour cream', 'cottage cheese', 'cream cheese', 'whipped cream', 'half and half', 'buttermilk', 'ice cream', 'egg', 'eggs', 'mayonnaise', 'ranch', 'dressing'],
  Meat: ['chicken', 'beef', 'pork', 'turkey', 'lamb', 'steak', 'ground beef', 'burger', 'sausage', 'bacon', 'ham', 'salami', 'pepperoni', 'roast', 'ribs', 'wing', 'drumstick', 'breast', 'thigh', 'fish', 'salmon', 'tuna', 'shrimp', 'cod', 'tilapia', 'seafood', 'crab', 'lobster'],
  Bakery: ['bread', 'bagel', 'muffin', 'croissant', 'roll', 'bun', 'tortilla', 'pita', 'naan', 'baguette', 'sourdough', 'loaf', 'cake', 'pie', 'cookie', 'donut', 'pastry', 'doughnut', 'english muffin', 'pita bread', 'wrap', 'flour', 'yeast'],
  Pantry: ['rice', 'pasta', 'noodle', 'spaghetti', 'penne', 'macaroni', 'cereal', 'oatmeal', 'oats', 'granola', 'sugar', 'flour', 'oil', 'olive oil', 'vinegar', 'soy sauce', 'hot sauce', 'ketchup', 'mustard', 'mayo', 'peanut butter', 'jelly', 'jam', 'honey', 'syrup', 'salsa', 'soup', 'broth', 'stock', 'can', 'canned', 'beans', 'lentil', 'chickpea', 'tuna can', 'sardine', 'olive', 'pickle', 'sauce', 'marinara', 'pesto', 'taco', 'seasoning', 'spice', 'salt', 'pepper spice', 'cinnamon'],
  Frozen: ['frozen', 'pizza', 'waffle', 'ice cream', 'popsicle', 'frozen dinner', 'tv dinner', 'burrito', 'frozen vegetable', 'french fry', 'fries', 'nugget', 'fish stick', 'pie frozen'],
  Beverages: ['water', 'soda', 'coke', 'pepsi', 'sprite', 'juice', 'orange juice', 'apple juice', 'cranberry juice', 'grape juice', 'lemonade', 'tea', 'coffee', 'beer', 'wine', 'seltzer', 'sparkling water', 'gatorade', 'powerade', 'energy drink', 'koolaid', 'hot chocolate', 'milkshake', 'smoothie'],
  Household: ['toilet paper', 'paper towel', 'tissue', 'napkin', 'trash bag', 'garbage bag', 'aluminum foil', 'plastic wrap', 'ziploc', 'detergent', 'soap', 'shampoo', 'conditioner', 'toothpaste', 'toothbrush', 'deodorant', 'lotion', 'razor', 'shaving cream', 'bleach', 'cleaner', 'sponge', 'dish soap', 'laundry', 'fabric softener', 'air freshener', 'battery', 'light bulb', 'bag'],
  Snacks: ['chip', 'crisp', 'pretzel', 'popcorn', 'cracker', 'nut', 'almond', 'cashew', 'peanut', 'walnut', 'trail mix', 'granola bar', 'protein bar', 'candy', 'chocolate', 'gum', 'cookie', 'brownie', 'dip', 'hummus', 'salsa snack'],
};

const UNITS = ['lb', 'oz', 'gal', 'pt', 'qt', 'kg', 'g', 'ml', 'l', 'pack', 'bunch', 'dozen', 'box', 'bag', 'can', 'bottle', 'jar', 'loaf', 'cnt', 'oz.', 'lb.', 'gal.', 'qt.', 'pt.', 'kg.', 'ml.', 'l.', 'oz', 'lbs', 'lb', 'gallon', 'quart', 'pint', 'liter', 'litre', 'milliliter', 'millilitre', 'kilogram', 'gram', 'pound', 'ounce'];

export function parseNaturalLanguage(input: string): ParsedItem[] {
  if (!input.trim()) return [];

  // Split by comma or newline
  const rawItems = input.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
  
  return rawItems.map(raw => parseSingleItem(raw));
}

function parseSingleItem(raw: string): ParsedItem {
  let remaining = raw.toLowerCase().trim();
  
  // Extract price ($X.XX or X.XX dollars)
  let priceCents: number | null = null;
  const priceMatch = remaining.match(/\$(\d+(?:\.\d{1,2})?)/);
  if (priceMatch) {
    priceCents = Math.round(parseFloat(priceMatch[1]) * 100);
    remaining = remaining.replace(priceMatch[0], '').trim();
  }
  
  // Extract quantity (leading number)
  let quantity = 1;
  const qtyMatch = remaining.match(/^(\d+(?:\.\d+)?)\s*/);
  if (qtyMatch) {
    quantity = parseFloat(qtyMatch[1]);
    remaining = remaining.slice(qtyMatch[0].length).trim();
  }
  
  // Handle "dozen" as quantity
  if (remaining.startsWith('dozen ')) {
    quantity = 12;
    remaining = remaining.slice(6);
  }
  
  // Extract unit
  let unit: string | null = null;
  for (const u of UNITS) {
    const unitRegex = new RegExp(`^(${u})\\b\\s*`, 'i');
    const match = remaining.match(unitRegex);
    if (match) {
      unit = match[1].toLowerCase();
      remaining = remaining.slice(match[0].length).trim();
      break;
    }
  }
  
  // Clean up the name
  let name = remaining
    .replace(/^\s+|\s+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Capitalize first letter of each word
  name = name.replace(/\b\w/g, c => c.toUpperCase());
  
  // Detect category
  const category = detectCategory(name, unit);
  
  return {
    name: name || raw.trim(),
    quantity,
    unit,
    category,
    estimated_price_cents: priceCents,
  };
}

function detectCategory(itemName: string, unit: string | null): string {
  const lowerName = itemName.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerName.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }
  
  // Unit-based detection
  if (unit === 'loaf') return 'Bakery';
  if (unit === 'bottle' && lowerName.includes('wine')) return 'Beverages';
  if (unit === 'can' && !lowerName.includes('cleaner')) return 'Pantry';
  if (unit === 'jar') return 'Pantry';
  
  return 'Other';
}

export function normalizeItemName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

export function findDuplicates(newItems: ParsedItem[], existingItems: { name: string; category: string }[]): ParsedItem[] {
  return newItems.filter(newItem => {
    const normalizedNew = normalizeItemName(newItem.name);
    return existingItems.some(existing => 
      normalizeItemName(existing.name) === normalizedNew
    );
  });
}

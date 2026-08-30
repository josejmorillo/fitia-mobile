import type { NutritionData } from '../../utils/types';
import { FOOD_CATEGORIES } from '../../utils/constants';

interface OFFNutriments {
  'energy-kcal_100g'?: number;
  'energy-kcal'?: number;
  energy_100g?: number;
  proteins_100g?: number;
  carbohydrates_100g?: number;
  fat_100g?: number;
}

interface OFFProduct {
  id?: string;
  code?: string;
  product_name?: string;
  product_name_es?: string;
  brands?: string;
  nutriments?: OFFNutriments;
  categories_tags?: string[];
  serving_quantity?: number;
  serving_size?: string;
}

const categoryToAppCategory = (categories?: string[]): string | null => {
  if (!categories?.length) return null;
  const cat = categories.join(' ').toLowerCase();

  if (cat.includes('meat') || cat.includes('carne') || cat.includes('chicken') || cat.includes('pollo') || cat.includes('beef') || cat.includes('pork') || cat.includes('cerdo')) return 'Carnes';
  if (cat.includes('fish') || cat.includes('pescado') || cat.includes('tuna') || cat.includes('atun') || cat.includes('salmon')) return 'Pescados';
  if (cat.includes('seafood') || cat.includes('marisco') || cat.includes('shrimp') || cat.includes('crab')) return 'Mariscos';
  if (cat.includes('dairy') || cat.includes('milk') || cat.includes('lacteo') || cat.includes('cheese') || cat.includes('queso') || cat.includes('yogur')) return 'Lácteos';
  if (cat.includes('egg') || cat.includes('huevo')) return 'Huevos';
  if (cat.includes('tomato') || cat.includes('tomate') || cat.includes('tomatoes')) return 'Verduras';
  if (cat.includes('vegetable') || cat.includes('verdura') || cat.includes('vegetal')) return 'Verduras';
  if (cat.includes('fruit') || cat.includes('fruta')) return 'Frutas';
  if (cat.includes('legume') || cat.includes('legumbre') || cat.includes('bean') || cat.includes('lentil') || cat.includes('garbanzo')) return 'Legumbres';
  if (cat.includes('cereal') || cat.includes('grain') || cat.includes('oat') || cat.includes('avena') || cat.includes('rice') || cat.includes('arroz')) return 'Cereales';
  if (cat.includes('bread') || cat.includes('pan') || cat.includes('pasta') || cat.includes('dough') || cat.includes('masa')) return 'Panes y masas';
  if (cat.includes('oil') || cat.includes('aceite') || cat.includes('fat') || cat.includes('grasa') || cat.includes('butter') || cat.includes('mantequilla')) return 'Grasas';
  if (cat.includes('sauce') || cat.includes('salsa') || cat.includes('condiment') || cat.includes('dressing')) return 'Salsas';
  if (cat.includes('sweet') || cat.includes('dulce') || cat.includes('chocolate') || cat.includes('candy') || cat.includes('dessert') || cat.includes('postre') || cat.includes('cake') || cat.includes('tarta') || cat.includes('cookie') || cat.includes('galleta')) return 'Postres';
  if (cat.includes('beverage') || cat.includes('bebida') || cat.includes('drink') || cat.includes('juice') || cat.includes('zumo') || cat.includes('water') || cat.includes('agua')) return 'Bebidas';
  if (cat.includes('snack') || cat.includes('chip') || cat.includes('crisp') || cat.includes('patatas fritas')) return 'Snacks';
  if (cat.includes('aperitiv') || cat.includes('appetizer')) return 'Aperitivos';
  if (cat.includes('sausage') || cat.includes('embutido') || cat.includes('salchich') || cat.includes('chorizo') || cat.includes('jamon') || cat.includes('ham')) return 'Embutidos';
  if (cat.includes('frozen') || cat.includes('congelado') || cat.includes('prepared') || cat.includes('precocinado')) return 'Precocinados';

  return null;
};

const categoryToEmoji = (categories?: string[]): string => {
  if (!categories?.length) return '🍽️';
  const cat = categories.join(' ').toLowerCase();
  if (cat.includes('chicken') || cat.includes('pollo')) return '🍗';
  if (cat.includes('meat') || cat.includes('carne') || cat.includes('beef') || cat.includes('pork')) return '🥩';
  if (cat.includes('fish') || cat.includes('pescado') || cat.includes('tuna') || cat.includes('atun') || cat.includes('salmon')) return '🐟';
  if (cat.includes('seafood') || cat.includes('marisco') || cat.includes('shrimp')) return '🦐';
  if (cat.includes('dairy') || cat.includes('milk') || cat.includes('lacteo')) return '🥛';
  if (cat.includes('cheese') || cat.includes('queso')) return '🧀';
  if (cat.includes('yogur')) return '🫙';
  if (cat.includes('egg') || cat.includes('huevo')) return '🥚';
  if (cat.includes('tomato') || cat.includes('tomate') || cat.includes('tomatoes')) return '🍅';
  if (cat.includes('vegetable') || cat.includes('verdura') || cat.includes('vegetal')) return '🥦';
  if (cat.includes('fruit') || cat.includes('fruta')) return '🍎';
  if (cat.includes('bread') || cat.includes('pan')) return '🍞';
  if (cat.includes('pasta')) return '🍝';
  if (cat.includes('rice') || cat.includes('arroz') || cat.includes('cereal') || cat.includes('grain') || cat.includes('oat') || cat.includes('avena')) return '🌾';
  if (cat.includes('legume') || cat.includes('legumbre') || cat.includes('bean') || cat.includes('lentil')) return '🫘';
  if (cat.includes('nut') || cat.includes('frutos secos') || cat.includes('seed')) return '🥜';
  if (cat.includes('oil') || cat.includes('aceite')) return '🫙';
  if (cat.includes('butter') || cat.includes('mantequilla') || cat.includes('fat') || cat.includes('grasa')) return '🧈';
  if (cat.includes('chocolate') || cat.includes('sweet') || cat.includes('dulce') || cat.includes('candy') || cat.includes('cookie') || cat.includes('galleta')) return '🍫';
  if (cat.includes('cake') || cat.includes('tarta') || cat.includes('dessert') || cat.includes('postre')) return '🍰';
  if (cat.includes('juice') || cat.includes('zumo')) return '🍊';
  if (cat.includes('beverage') || cat.includes('bebida') || cat.includes('drink')) return '🥤';
  if (cat.includes('water') || cat.includes('agua')) return '💧';
  if (cat.includes('snack') || cat.includes('chip') || cat.includes('crisp')) return '🥨';
  if (cat.includes('sauce') || cat.includes('salsa') || cat.includes('condiment')) return '🧃';
  if (cat.includes('frozen') || cat.includes('congelado')) return '🧊';
  if (cat.includes('sausage') || cat.includes('embutido') || cat.includes('salchich') || cat.includes('chorizo')) return '🌭';
  if (cat.includes('ham') || cat.includes('jamon')) return '🍖';
  return '🍽️';
};

const translateServingName = (name: string): string => {
  const map: Record<string, string> = {
    can: 'lata', tin: 'lata', jar: 'tarro', bottle: 'botella', bag: 'bolsa',
    pack: 'paquete', package: 'paquete', sachet: 'sobre', pouch: 'bolsita',
    box: 'caja', cup: 'taza', glass: 'vaso', bowl: 'bol', pot: 'bote', tube: 'tubo',
    serving: 'ración', portion: 'ración', piece: 'pieza', slice: 'rebanada',
    unit: 'unidad', tablet: 'pastilla', scoop: 'medidor', bar: 'barrita',
    stick: 'palito', strip: 'tira', chunk: 'trozo', handful: 'puñado',
    egg: 'huevo', fillet: 'filete', breast: 'pechuga', thigh: 'muslo', leg: 'pierna',
    tablespoon: 'cucharada', tbsp: 'cucharada', teaspoon: 'cucharadita', tsp: 'cucharadita',
  };
  const lower = name.toLowerCase().trim();
  return map[lower] ?? name;
};

const parseServingSize = (
  servingSize?: string,
  servingQuantity?: number
): { name: string | null; amount: number | null } => {
  if (!servingSize) return { name: null, amount: servingQuantity ?? null };
  const s = servingSize.trim().toLowerCase();

  const matchWithParens = s.match(/^(?:\d+\s+)?([a-záéíóúüñ]+)[^(]*\((\d+(?:[.,]\d+)?)\s*g\)/i);
  if (matchWithParens) {
    return {
      name: translateServingName(matchWithParens[1]),
      amount: parseFloat(matchWithParens[2].replace(',', '.')),
    };
  }

  const matchPureGrams = s.match(/^(\d+(?:[.,]\d+)?)\s*g$/);
  if (matchPureGrams) return { name: null, amount: null };

  const matchNamed = s.match(/^\d+\s+([a-záéíóúüñ]+)/i);
  if (matchNamed) {
    return { name: translateServingName(matchNamed[1]), amount: servingQuantity ?? null };
  }

  return { name: null, amount: null };
};

const toValidCategory = (cat: string | null): string | null => {
  if (!cat) return null;
  return FOOD_CATEGORIES.includes(cat) ? cat : null;
};

export function mapOFFProductToNutritionData(product: OFFProduct): NutritionData | null {
  const name = product.product_name_es || product.product_name;
  if (!name?.trim()) return null;

  const n = product.nutriments ?? {};
  const calories = n['energy-kcal_100g'] ?? n['energy-kcal'] ?? null;
  const protein = n['proteins_100g'] ?? null;
  const carbs = n['carbohydrates_100g'] ?? null;
  const fat = n['fat_100g'] ?? null;

  if (calories === null && protein === null && carbs === null && fat === null) return null;

  const brand = product.brands ? product.brands.split(',')[0].trim() || null : null;
  const serving = parseServingSize(product.serving_size, product.serving_quantity);
  const category = toValidCategory(categoryToAppCategory(product.categories_tags));
  const emoji = categoryToEmoji(product.categories_tags);

  return {
    name: name.trim(),
    brand,
    kcal_100g: calories !== null ? Math.round(calories * 10) / 10 : null,
    protein_g: protein !== null ? Math.round(protein * 10) / 10 : null,
    carbs_g: carbs !== null ? Math.round(carbs * 10) / 10 : null,
    fat_g: fat !== null ? Math.round(fat * 10) / 10 : null,
    fiber_g: null,
    sugar_g: null,
    serving_size_g: serving.name ? serving.amount : null,
    serving_name: serving.name,
    serving_amount_g: serving.name ? serving.amount : null,
    category,
    emoji,
  };
}

export async function lookupBarcode(barcode: string): Promise<NutritionData | null> {
  const response = await fetch(
    `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json` +
      `?fields=product_name,product_name_es,brands,nutriments,categories_tags,serving_size,serving_quantity`
  );

  if (!response.ok) throw new Error(`Open Food Facts API error: ${response.status}`);

  const data: { status: number; product?: OFFProduct } = await response.json();
  if (data.status === 0 || !data.product) return null;

  return mapOFFProductToNutritionData(data.product);
}

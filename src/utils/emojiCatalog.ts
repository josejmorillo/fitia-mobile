export interface EmojiEntry {
  emoji: string;
  category: string;
  keywords: string;
}

export const EMOJI_CATEGORIES = [
  'Todos',
  'Frutas',
  'Verduras',
  'Carnes y pescado',
  'Lácteos y huevos',
  'Pan y bollería',
  'Pasta y arroz',
  'Preparados',
  'Bebidas',
  'Postres y dulces',
] as const;

type Row = [emoji: string, category: Exclude<(typeof EMOJI_CATEGORIES)[number], 'Todos'>, keywords: string];

const ROWS: Row[] = [
  ['🍎', 'Frutas', 'manzana apple'],
  ['🍐', 'Frutas', 'pera pear'],
  ['🍊', 'Frutas', 'naranja mandarina orange tangerine'],
  ['🍋', 'Frutas', 'limon lemon'],
  ['🍌', 'Frutas', 'platano banana'],
  ['🍉', 'Frutas', 'sandia watermelon'],
  ['🍇', 'Frutas', 'uvas grapes'],
  ['🍓', 'Frutas', 'fresa fresas strawberry'],
  ['🫐', 'Frutas', 'arandanos blueberry'],
  ['🍈', 'Frutas', 'melon'],
  ['🍒', 'Frutas', 'cerezas cherry'],
  ['🍑', 'Frutas', 'melocoton durazno peach'],
  ['🥭', 'Frutas', 'mango'],
  ['🍍', 'Frutas', 'pina pineapple'],
  ['🥥', 'Frutas', 'coco coconut'],
  ['🥝', 'Frutas', 'kiwi'],
  ['🌰', 'Frutas', 'castaña chestnut'],
  ['🍅', 'Verduras', 'tomate tomato'],
  ['🥕', 'Verduras', 'zanahoria carrot'],
  ['🌽', 'Verduras', 'maiz corn'],
  ['🥦', 'Verduras', 'brocoli broccoli'],
  ['🍆', 'Verduras', 'berenjena eggplant'],
  ['🥑', 'Verduras', 'aguacate avocado'],
  ['🌶️', 'Verduras', 'guindilla chile chili picante'],
  ['🫑', 'Verduras', 'pimiento pepper'],
  ['🥒', 'Verduras', 'pepinillo pepino cucumber pickle'],
  ['🥬', 'Verduras', 'lechuga verdura verde cabbage lettuce'],
  ['🧅', 'Verduras', 'cebolla onion'],
  ['🧄', 'Verduras', 'ajo garlic'],
  ['🫚', 'Verduras', 'jengibre ginger'],
  ['🥔', 'Verduras', 'patata papa potato'],
  ['🍠', 'Verduras', 'boniato batata sweet potato'],
  ['🫛', 'Verduras', 'guisantes peas'],
  ['🥜', 'Verduras', 'cacahuete mani peanut'],
  ['🍗', 'Carnes y pescado', 'pollo muslo chicken leg'],
  ['🍖', 'Carnes y pescado', 'carne hueso meat'],
  ['🥩', 'Carnes y pescado', 'filete bistec steak beef'],
  ['🥓', 'Carnes y pescado', 'bacon panceta'],
  ['🍤', 'Carnes y pescado', 'gambas langostinos shrimp prawn'],
  ['🍣', 'Carnes y pescado', 'sushi'],
  ['🦐', 'Carnes y pescado', 'gamba langostino'],
  ['🦞', 'Carnes y pescado', 'langosta lobster'],
  ['🦀', 'Carnes y pescado', 'cangrejo crab'],
  ['🐟', 'Carnes y pescado', 'pescado fish'],
  ['🐠', 'Carnes y pescado', 'pez tropical'],
  ['🐡', 'Carnes y pescado', 'pez globo'],
  ['🐙', 'Carnes y pescado', 'pulpo octopus'],
  ['🦑', 'Carnes y pescado', 'calamar squid'],
  ['🐔', 'Carnes y pescado', 'pollo gallina chicken'],
  ['🐷', 'Carnes y pescado', 'cerdo chancho pig'],
  ['🐮', 'Carnes y pescado', 'vaca ternera cow beef'],
  ['🐑', 'Carnes y pescado', 'cordero oveja sheep'],
  ['🦃', 'Carnes y pescado', 'pavo turkey'],
  ['🥚', 'Lácteos y huevos', 'huevo egg'],
  ['🧀', 'Lácteos y huevos', 'queso cheese'],
  ['🥛', 'Lácteos y huevos', 'leche milk'],
  ['🍞', 'Pan y bollería', 'pan bread'],
  ['🥖', 'Pan y bollería', 'baguette barra pan'],
  ['🥐', 'Pan y bollería', 'croissant'],
  ['🥨', 'Pan y bollería', 'pretzel'],
  ['🥯', 'Pan y bollería', 'bagel'],
  ['🥞', 'Pan y bollería', 'panqueques tortitas pancakes'],
  ['🧇', 'Pan y bollería', 'gofres waffles'],
  ['🍕', 'Pasta y arroz', 'pizza'],
  ['🍔', 'Pasta y arroz', 'hamburguesa burger'],
  ['🍟', 'Pasta y arroz', 'patatas fritas fries'],
  ['🌭', 'Pasta y arroz', 'perrito hot dog salchicha'],
  ['🌮', 'Pasta y arroz', 'taco'],
  ['🌯', 'Pasta y arroz', 'burrito'],
  ['🥙', 'Pasta y arroz', 'durum kebab'],
  ['🥪', 'Pasta y arroz', 'sandwich bocadillo'],
  ['🍜', 'Pasta y arroz', 'sopa noodles ramen'],
  ['🍝', 'Pasta y arroz', 'espaguetis pasta spaghetti'],
  ['🍲', 'Pasta y arroz', 'guiso estofado stew'],
  ['🍛', 'Pasta y arroz', 'curry arroz'],
  ['🥟', 'Pasta y arroz', 'empanadilla dumpling gyozas'],
  ['🍱', 'Pasta y arroz', 'bento'],
  ['🍘', 'Pasta y arroz', 'galleta arroz'],
  ['🍙', 'Pasta y arroz', 'onigiri'],
  ['🍚', 'Pasta y arroz', 'arroz rice'],
  ['🫕', 'Pasta y arroz', 'fondue queso'],
  ['🥗', 'Preparados', 'ensalada salad'],
  ['🥣', 'Preparados', 'bol cereal sopa bowl'],
  ['🍳', 'Preparados', 'huevo frito sarten frying pan'],
  ['🥘', 'Preparados', 'paella cazuela'],
  ['🍿', 'Preparados', 'palomitas popcorn'],
  ['🍯', 'Preparados', 'miel honey'],
  ['🧂', 'Preparados', 'sal salt'],
  ['🧈', 'Preparados', 'mantequilla butter'],
  ['🍽️', 'Preparados', 'plato cubiertos plate'],
  ['🥤', 'Bebidas', 'refresco soda batido'],
  ['🧃', 'Bebidas', 'zumo jugo juice'],
  ['☕', 'Bebidas', 'cafe coffee'],
  ['🫖', 'Bebidas', 'te infusión tetera'],
  ['🍵', 'Bebidas', 'te matcha'],
  ['🍺', 'Bebidas', 'cerveza beer'],
  ['🍻', 'Bebidas', 'cervezas brindis'],
  ['🥂', 'Bebidas', 'brindis champan'],
  ['🥃', 'Bebidas', 'whisky'],
  ['🍸', 'Bebidas', 'coctel martini'],
  ['🍹', 'Bebidas', 'tropical coctel'],
  ['🧊', 'Bebidas', 'hielo ice'],
  ['🍦', 'Postres y dulces', 'helado cono ice cream'],
  ['🍧', 'Postres y dulces', 'granizado'],
  ['🍨', 'Postres y dulces', 'copa helado'],
  ['🍩', 'Postres y dulces', 'donut dónut'],
  ['🍪', 'Postres y dulces', 'galleta cookie'],
  ['🎂', 'Postres y dulces', 'tarta cumpleaños'],
  ['🍰', 'Postres y dulces', 'pastel tarta cake'],
  ['🧁', 'Postres y dulces', 'cupcake magdalena'],
  ['🥧', 'Postres y dulces', 'pay pie quiche'],
  ['🍫', 'Postres y dulces', 'chocolate'],
  ['🍬', 'Postres y dulces', 'caramelo golosina'],
  ['🍭', 'Postres y dulces', 'piruleta lollipop'],
  ['🍮', 'Postres y dulces', 'flan pudding'],
  ['🍡', 'Postres y dulces', 'dango brocheta'],
];

export const EMOJI_CATALOG: EmojiEntry[] = ROWS.map(([emoji, category, keywords]) => ({
  emoji,
  category,
  keywords: keywords.toLowerCase(),
}));

export function searchEmojis(query: string): EmojiEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return EMOJI_CATALOG.filter(
    (e) =>
      e.emoji.toLowerCase().includes(q) ||
      e.keywords.includes(q) ||
      e.category.toLowerCase().includes(q)
  );
}

export function emojisByCategory(category: string): string[] {
  if (category === 'Todos') return EMOJI_CATALOG.map((e) => e.emoji);
  return EMOJI_CATALOG.filter((e) => e.category === category).map((e) => e.emoji);
}

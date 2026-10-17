import { useEffect, useState } from 'react';

import { getRecipeIngredients } from '@/services/recipeService';
import { ingredientTotals, recipeMacros, type IngredientTotals } from '@/utils/macros';
import { calcCarbRations, formatRations } from '@/utils/rations';
import type { Recipe } from '@/utils/types';
import { QuantitySheet } from './QuantitySheet';

interface RecipeAmountModalProps {
  recipe: Recipe | null;
  onClose: () => void;
  onConfirm: (grams: number) => void;
  showRations?: boolean;
  gramsPerRation?: number;
}

type Unit = 'units' | 'g';

export function RecipeAmountModal({
  recipe,
  onClose,
  onConfirm,
  showRations = false,
  gramsPerRation,
}: RecipeAmountModalProps) {
  const [totals, setTotals] = useState<IngredientTotals | null>(null);
  const [unit, setUnit] = useState<Unit>('g');
  const [amount, setAmount] = useState('100');
  const [wasVisible, setWasVisible] = useState(false);

  if (recipe && !wasVisible) {
    setWasVisible(true);
    setTotals(null);
    setUnit('g');
    setAmount('100');
  } else if (!recipe && wasVisible) {
    setWasVisible(false);
  }

  useEffect(() => {
    if (!recipe || !wasVisible) return;
    let cancelled = false;
    getRecipeIngredients(recipe.id).then((ings) => {
      if (cancelled) return;
      const t = ingredientTotals(
        ings.filter((i) => i.food).map((i) => ({ food: i.food!, amount: i.amount }))
      );
      setTotals(t);
      if (recipe.servingGrams) {
        setUnit('units');
        setAmount('1');
      } else {
        setUnit('g');
        setAmount(t.totalGrams > 0 ? String(Math.round(t.totalGrams)) : '100');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [recipe, wasVisible]);

  const servingGrams = recipe?.servingGrams ?? null;
  const parsed = parseFloat(amount.replace(',', '.'));
  const quantity = isNaN(parsed) || parsed <= 0 ? 0 : parsed;
  const grams = unit === 'units' && servingGrams ? quantity * servingGrams : quantity;
  const macros =
    totals && grams > 0
      ? recipeMacros(totals, grams)
      : { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const hint =
    unit === 'units' && servingGrams ? `= ${Math.round(quantity * servingGrams)} g` : undefined;
  const subtitle = totals
    ? `${Math.round(totals.calories)} kcal · ${Math.round(totals.totalGrams)} g${
        showRations && gramsPerRation && gramsPerRation > 0
          ? ` · ${formatRations(calcCarbRations(totals.carbs, gramsPerRation))} R`
          : ''
      } la receta`
    : 'Calculando…';

  return (
    <QuantitySheet
      visible={recipe != null}
      emoji={recipe?.emoji ?? '🍽️'}
      name={recipe?.name ?? ''}
      subtitle={subtitle}
      units={
        servingGrams ? { labels: ['Raciones', 'Gramos'], value: unit, onChange: setUnit } : null
      }
      amount={amount}
      onAmountChange={setAmount}
      unitSuffix={unit === 'units' ? 'raciones' : 'g'}
      hint={hint}
      macros={macros}
      confirmDisabled={!totals || grams <= 0}
      showRations={showRations}
      gramsPerRation={gramsPerRation}
      onClose={onClose}
      onConfirm={() => onConfirm(grams)}
    />
  );
}

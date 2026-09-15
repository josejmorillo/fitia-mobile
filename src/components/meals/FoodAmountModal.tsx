import { useState } from 'react';

import { foodMacros } from '@/utils/macros';
import type { Food } from '@/utils/types';
import { QuantitySheet } from './QuantitySheet';

interface FoodAmountModalProps {
  food: Food | null;
  onClose: () => void;
  onConfirm: (grams: number) => void;
}

type Unit = 'units' | 'g';

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function FoodAmountModal({ food, onClose, onConfirm }: FoodAmountModalProps) {
  const servingGrams = food?.servingAmount ?? null;
  const unitLabel = food?.servingName ? capitalize(food.servingName) : 'Unidades';

  const [unit, setUnit] = useState<Unit>('g');
  const [amount, setAmount] = useState('100');
  const [wasVisible, setWasVisible] = useState(false);

  if (food && !wasVisible) {
    setWasVisible(true);
    if (servingGrams) {
      setUnit('units');
      setAmount('1');
    } else {
      setUnit('g');
      setAmount('100');
    }
  } else if (!food && wasVisible) {
    setWasVisible(false);
  }

  const parsed = parseFloat(amount.replace(',', '.'));
  const quantity = isNaN(parsed) || parsed <= 0 ? 0 : parsed;
  const grams = unit === 'units' && servingGrams ? quantity * servingGrams : quantity;
  const macros =
    food && grams > 0 ? foodMacros(food, grams) : { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const hint =
    unit === 'units' && servingGrams ? `= ${Math.round(quantity * servingGrams)} g` : undefined;

  return (
    <QuantitySheet
      visible={food != null}
      emoji={food?.emoji ?? '🍽️'}
      name={food?.name ?? ''}
      subtitle={
        food
          ? `${food.caloriesPer100g} kcal / 100 g${food.brand ? ` · ${food.brand}` : ''}`
          : undefined
      }
      units={servingGrams ? { labels: [unitLabel, 'Gramos'], value: unit, onChange: setUnit } : null}
      amount={amount}
      onAmountChange={setAmount}
      unitSuffix={unit === 'units' ? (food?.servingName ?? 'ud') : 'g'}
      hint={hint}
      macros={macros}
      confirmDisabled={grams <= 0}
      onClose={onClose}
      onConfirm={() => onConfirm(grams)}
    />
  );
}

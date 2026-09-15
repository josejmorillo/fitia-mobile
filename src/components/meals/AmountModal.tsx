import { useState } from 'react';

import type { DailyLogItem } from '@/utils/types';
import { QuantitySheet } from './QuantitySheet';

interface AmountModalProps {
  item: DailyLogItem | null;
  onClose: () => void;
  onSave: (itemId: number, amount: number) => void;
}

type Unit = 'units' | 'g';

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function AmountModal({ item, onClose, onSave }: AmountModalProps) {
  const food = item?.food;
  const recipe = item?.recipe;
  const servingGrams = recipe?.servingGrams ?? food?.servingAmount ?? null;
  const unitLabel = recipe
    ? 'Raciones'
    : food?.servingName
      ? capitalize(food.servingName)
      : 'Unidades';

  const [value, setValue] = useState('');
  const [unit, setUnit] = useState<Unit>('g');
  const [wasOpen, setWasOpen] = useState(false);

  if (item && !wasOpen) {
    setWasOpen(true);
    setUnit(servingGrams ? 'units' : 'g');
    const initial = servingGrams ? item.amount / servingGrams : item.amount;
    setValue(String(Math.round(initial * 100) / 100));
  } else if (!item && wasOpen) {
    setWasOpen(false);
  }

  const parsed = parseFloat(value.replace(',', '.'));
  const quantity = isNaN(parsed) || parsed <= 0 ? 0 : parsed;
  const grams = unit === 'units' && servingGrams ? quantity * servingGrams : quantity;

  const ratio = item && item.amount > 0 ? grams / item.amount : 0;
  const base = item?.macros ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const macros = {
    calories: Math.round(base.calories * ratio),
    protein: round1(base.protein * ratio),
    carbs: round1(base.carbs * ratio),
    fat: round1(base.fat * ratio),
  };

  const hint =
    unit === 'units' && servingGrams ? `= ${Math.round(quantity * servingGrams)} g` : undefined;

  const name = food?.name ?? recipe?.name ?? '';
  const emoji = food?.emoji ?? recipe?.emoji ?? '🍽️';
  const subtitle = food
    ? `${food.caloriesPer100g} kcal / 100 g${food.brand ? ` · ${food.brand}` : ''}`
    : recipe
      ? 'Receta'
      : undefined;

  return (
    <QuantitySheet
      visible={item != null}
      emoji={emoji}
      name={name}
      subtitle={subtitle}
      units={
        servingGrams ? { labels: [unitLabel, 'Gramos'], value: unit, onChange: setUnit } : null
      }
      amount={value}
      onAmountChange={setValue}
      unitSuffix={unit === 'units' ? (recipe ? 'raciones' : (food?.servingName ?? 'ud')) : 'g'}
      hint={hint}
      macros={macros}
      confirmLabel="Guardar"
      confirmDisabled={grams <= 0}
      onClose={onClose}
      onConfirm={() => item && onSave(item.id, grams)}
    />
  );
}

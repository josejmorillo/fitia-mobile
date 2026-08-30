# Fitia Mobile — AGENTS

App Android de control de macros (React Native/Expo). Single-user, local-first.
Fork independiente de la versión web (Spring Boot + React).

## Stack

- Expo SDK 57 (managed) + TypeScript strict
- expo-router (file-based routing en `src/app/`)
- expo-sqlite (DB local), expo-secure-store (API keys), expo-camera (barcode)
- Iconos: `@expo/vector-icons` (Ionicons)

## Estructura

```
src/
├── app/            # Pantallas (expo-router)
│   ├── _layout.tsx       # Root Stack
│   ├── (tabs)/           # plan, foods, body, settings
│   ├── food/             # new, [id]
│   └── recipe/           # new, [id]
├── components/      # Componentes reutilizables (por fase)
├── services/        # Acceso a DB (database.ts + servicios por dominio)
└── utils/           # types.ts, constants.ts, colors.ts, nutritionCalculator.ts
```

## Convenciones

- Componente: `PascalCase.tsx` · servicio: `camelCase.ts` · interface: `PascalCase`
- DB: `snake_case` · JS: `camelCase`
- TypeScript strict: sin `any`, sin `@ts-ignore`
- Migraciones: `PRAGMA user_version` en `src/services/database.ts`

## Comandos

```bash
npm start      # dev server (Expo Go)
npm run lint   # eslint
npx tsc --noEmit  # typecheck
```

## Nombres acordados

- Tabs: `plan`, `foods`, `body`, `settings`
- `CustomMeal` → `Recipe` (tabla `recipes`, FK `recipe_id`)
- Servicio de sugerencias: `suggestionService`

## Estado / plan

Ver el vault Obsidian: `01-Areas/My-Fitia/My-Fitia-Mobile/Plan.md`.

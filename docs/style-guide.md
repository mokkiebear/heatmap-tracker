# Heatmap Tracker Style Guide

This guide outlines the standards and best practices for developing the Heatmap Tracker Obsidian plugin.

## 🛠 Technology Stack

- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Framework**: [React 19](https://react.dev/) (Functional Components & Hooks)
- **State Management**: React [Context API](https://react.dev/learn/passing-data-deeply-with-context)
- **Validation**: [Zod](https://zod.dev/)
- **Internationalization**: [i18next](https://www.i18next.com/) with `react-i18next`
- **Styling**: [SCSS](https://sass-lang.com/) (using `@use` modules)
- **Testing**: [Jest](https://jestjs.io/) & [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- **Build Tool**: [esbuild](https://esbuild.github.io/)

---

## 💻 Coding Standards

### TypeScript
- Use **strict types** wherever possible.
- Prefer `interface` for object shapes and `type` for unions/intersections.
- Avoid `any`. Use `unknown` if the type is truly dynamic and validate with Zod.

### React Components
- Use **Functional Components** with `React.memo` for performance where appropriate.
- Prefer **Hooks** (`useState`, `useMemo`, `useCallback`, `useEffect`) over class components.
- Keep components small and focused on a single responsibility.
- **Naming**: Use `PascalCase` for component files and function names (e.g., `HeatmapHeader.tsx`).
- **Cleanup**: Always provide cleanup functions in `useEffect` when using timers, event listeners, or Obsidian workspace events.

### State Management
- Use the **Context API** for global or cross-component state (e.g., `HeatmapContext`).
- Keep state as close to where it's used as possible to avoid unnecessary re-renders.
- **Obsidian Context**: Access the Obsidian `App` instance via `AppContext` rather than passing it through deep prop chains.

### 🛡 Validation & Error Handling
- Use **Zod** for all external data (e.g., codeblock parameters).
- **Graceful Degradation**: When validation fails, use `notify` from `src/utils/notify.ts` to inform the user but attempt to fall back to safe default values (e.g., `DEFAULT_TRACKER_DATA`).

---

## 📂 Project Structure & Naming

```text
src/
├── components/   # Reusable UI components (e.g., HeatmapHeader)
├── views/        # Page-level components (e.g., StatisticsView)
├── context/      # React contexts for state management
├── hooks/        # Custom React hooks
├── schemas/      # Zod validation schemas
├── utils/        # Helper functions (date, colors, core logic)
├── styles/       # Modular SCSS files
├── localization/ # i18n translation files
├── main.tsx      # Plugin entry point (Obsidian Plugin class)
└── App.tsx       # Root React component
```

### Naming Conventions
- **Files**:
    - Components/Views: `PascalCase.tsx`
    - Utils/Hooks/Contexts: `camelCase.ts` or `camelCase.tsx`
    - Styles: `kebab-case.scss`
- **Functions/Variables**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`

---

## 🌍 Internationalization (i18n)

- Use the `useTranslation` hook for all UI text.
- **Adding Languages**:
    1. Create a new locale file in `src/localization/locales/[lang].json`.
    2. Import and register the locale in `src/localization/i18n.ts`.
    3. Update `src/localization/languages.json` to include the new language in the settings UI.
- Translations should be nested logically (e.g., `settings.general.title`).

---

## 📅 Date Handling

- **UTC Mandatory**: Always use `UTC` methods (e.g., `getUTCDate()`, `getUTCFullYear()`) for all date logic. This avoids timezone discrepancies between the user's system and the heatmap display.
- Use the existing utilities in `src/utils/date.ts` for calculations (week numbers, day of year, etc.).

---

## 🎨 Styling Guidelines

### SCSS & BEM
- Use modular SCSS with `@use` for imports.
- Follow a simplified **BEM (Block Element Modifier)** naming convention:
    - Block: `.heatmap-tracker`
    - Element: `.heatmap-tracker__container`
    - Modifier: `.heatmap-tracker--loading`
- Avoid deep nesting (max 3 levels).

### Obsidian Integration
- Always use **Obsidian CSS Variables** for theme compatibility:
    - `--text-normal`, `--background-primary`, `--interactive-accent`, etc.
- Use the `.theme-dark` and `.theme-light` classes if specific theme adjustments are needed.

---

## 🧪 Testing & Quality

- **Unit Tests**: Place in `src/__tests__` or alongside the code using `.test.ts(x)` suffix.
- **Execution**: Run `npm test` to execute Jest.
- **Linting**: Follow the rules defined in `.eslintrc`. Run with `npm run build` (which includes type-checking).
- **Import Order**: Keep imports organized (External → Internal/Shared → Styles).

---

## 📝 Documentation

- Document complex logic with TSDoc comments.
- Update `CHANGELOG.md` for any significant changes or releases.
- Maintain the `ROADMAP.md` for future features and improvements.

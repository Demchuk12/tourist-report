# Tourist Report

MVP для керівників туристичних груп на SvelteKit 5. Допомагає вести тури, туристів та екскурсії й готувати дані до звітності.

## Можливості

- CRUD для турів, туристів та екскурсій;
- повнорозмірний календар минулих і майбутніх турів та екскурсій;
- зв’язки «тур → багато туристів» і «тур → багато екскурсій»;
- автоматичне очищення зв’язків після видалення сутності;
- пошук і dashboard з основними показниками;
- адаптивний desktop/mobile інтерфейс;
- українська й англійська локалізація через Paraglide JS;
- збереження даних в IndexedDB з автоматичною міграцією з `localStorage`;
- встановлення як PWA та офлайн-робота після першого завантаження.

## Архітектура

Структура feature-oriented, адаптована з FSD:

```text
src/lib/
├── shared/       # repository-контракти, утиліти, базовий UI
├── entities/     # Tour, Tourist, Excursion та їх типи
├── features/     # форми й бізнес-store
└── widgets/      # dashboard, навігація та CRUD-розділи
```

UI та store залежать від `TourReportRepository`, а не від IndexedDB. Для переходу на бекенд достатньо реалізувати, наприклад, `ApiTourReportRepository` з методами `load()` і `save()` та передати його в `TourReportStore` у `+page.svelte`.

PWA використовує нативний service worker SvelteKit. Для встановлення на телефоні production-версія має бути доступна через HTTPS.

## Розробка

```bash
npm install
npm run dev
```

Перевірки:

```bash
npm run check
npm run lint
npm run build
```

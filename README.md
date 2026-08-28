# dinner2.0

**Your recipes. One place.**

dinner2.0 is a mobile recipe manager for people who want one simple, reliable place for the recipes they collect and use every day. I am building it to solve a practical need: keeping recipes organized, easy to update, and genuinely useful while cooking.

The app will let users create a private recipe collection, add structured ingredients and preparation steps, edit recipes over time, and scale quantities to match the desired number of servings.

## Planned Features

- registration, login, and private recipe collections;
- manual recipe creation, editing, and deletion;
- structured ingredients, units, notes, and preparation steps;
- ingredient scaling for a selected number of servings;
- Polish and English interface languages;
- future additions: recipe imports from photos, URLs, YouTube, and voice, followed by shopping-list generation and better recipe organization.

## Technology Stack

- **Mobile:** React Native, Expo, Expo Router, TypeScript, TanStack Query
- **Web:** Expo web is a supported runtime and must remain functional alongside iOS and Android
- **Backend:** Node.js, NestJS, TypeScript, REST API
- **Data:** PostgreSQL, Prisma, Supabase
- **Validation:** Zod and NestJS DTO validation
- **Architecture:** pnpm monorepo with a mobile app, API, and shared types package

The mobile app communicates with application data exclusively through the backend REST API. User data and recipes are isolated and protected on the server side.

## Development Status

The project is being developed incrementally. The current focus is on building the monorepo and runtime foundation, followed by authentication and the core recipe workflow.

# dinner2.0

**Your recipes. One place.**

dinner2.0 is a mobile app for storing, organizing, and enjoying your own recipes. Users can build a private recipe collection, add ingredients and preparation steps, edit recipes, and scale ingredient quantities to match the desired number of servings.

The project is being built as a full-stack portfolio application, with a focus on secure architecture, clear separation of responsibilities, and practical use of modern technologies.

## Planned Features

- registration, login, and private recipe collections;
- manual recipe creation, editing, and deletion;
- structured ingredients, units, notes, and preparation steps;
- ingredient scaling for a selected number of servings;
- Polish and English interface languages;
- future additions: recipe imports from photos, URLs, YouTube, and voice, plus shopping-list generation.

## Technology Stack

- **Mobile:** React Native, Expo, Expo Router, TypeScript, TanStack Query
- **Backend:** Node.js, NestJS, TypeScript, REST API
- **Data:** PostgreSQL, Prisma, Supabase
- **Validation:** Zod and NestJS DTO validation
- **Architecture:** pnpm monorepo with a mobile app, API, and shared types package

The mobile app communicates with application data exclusively through the backend REST API. User data and recipes are isolated and protected on the server side.

## Status

The project is being developed incrementally. The monorepo and runtime foundation are currently being prepared.

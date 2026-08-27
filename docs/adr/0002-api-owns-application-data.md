# API owns application data access

The mobile application will access application data only through the NestJS REST API. Supabase provides PostgreSQL and authentication infrastructure, while NestJS and Prisma enforce validation, ownership, and application authorization so the backend remains reusable by future clients.

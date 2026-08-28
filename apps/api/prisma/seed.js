const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const systemIngredients = [
  ['flour', 'Mąka', 'Flour'],
  ['sugar', 'Cukier', 'Sugar'],
  ['salt', 'Sól', 'Salt'],
  ['pepper', 'Pieprz', 'Pepper'],
  ['egg', 'Jajko', 'Egg'],
  ['milk', 'Mleko', 'Milk'],
  ['butter', 'Masło', 'Butter'],
  ['olive-oil', 'Oliwa z oliwek', 'Olive oil'],
  ['onion', 'Cebula', 'Onion'],
  ['garlic', 'Czosnek', 'Garlic'],
  ['tomato', 'Pomidor', 'Tomato'],
  ['potato', 'Ziemniak', 'Potato'],
  ['carrot', 'Marchew', 'Carrot'],
  ['chicken-breast', 'Pierś z kurczaka', 'Chicken breast'],
  ['rice', 'Ryż', 'Rice'],
  ['pasta', 'Makaron', 'Pasta'],
];

async function main() {
  for (const [slug, namePl, nameEn] of systemIngredients) {
    await prisma.ingredientCatalogEntry.upsert({
      where: { slug },
      update: { namePl, nameEn, isActive: true, isSystem: true, ownerId: null },
      create: { slug, namePl, nameEn },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

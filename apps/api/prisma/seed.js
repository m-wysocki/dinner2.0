const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const systemIngredients = [
  { slug: 'flour', namePl: 'Mąka', nameEn: 'Flour' },
  { slug: 'sugar', namePl: 'Cukier', nameEn: 'Sugar' },
  { slug: 'salt', namePl: 'Sól', nameEn: 'Salt' },
  { slug: 'pepper', namePl: 'Pieprz', nameEn: 'Pepper' },
  { slug: 'egg', namePl: 'Jajko', nameEn: 'Egg' },
  { slug: 'milk', namePl: 'Mleko', nameEn: 'Milk' },
  { slug: 'butter', namePl: 'Masło', nameEn: 'Butter' },
  { slug: 'olive-oil', namePl: 'Oliwa z oliwek', nameEn: 'Olive oil' },
  { slug: 'onion', namePl: 'Cebula', nameEn: 'Onion' },
  { slug: 'garlic', namePl: 'Czosnek', nameEn: 'Garlic' },
  { slug: 'tomato', namePl: 'Pomidor', nameEn: 'Tomato' },
  { slug: 'potato', namePl: 'Ziemniak', nameEn: 'Potato' },
  { slug: 'carrot', namePl: 'Marchew', nameEn: 'Carrot' },
  {
    slug: 'chicken-breast',
    namePl: 'Pierś z kurczaka',
    nameEn: 'Chicken breast',
  },
  { slug: 'rice', namePl: 'Ryż', nameEn: 'Rice' },
  { slug: 'pasta', namePl: 'Makaron', nameEn: 'Pasta' },
];

async function main() {
  for (const { slug, namePl, nameEn } of systemIngredients) {
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

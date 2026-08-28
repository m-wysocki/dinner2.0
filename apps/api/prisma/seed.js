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
    const existing = await prisma.ingredientCatalogEntry.findUnique({
      where: { slug },
    });

    if (!existing) {
      await prisma.ingredientCatalogEntry.create({
        data: { slug, namePl, nameEn },
      });
    } else if (existing.isSystem) {
      await prisma.ingredientCatalogEntry.update({
        where: { id: existing.id },
        data: { namePl, nameEn, isActive: true },
      });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

const path = require('path');
const { PrismaClient } = require(path.join(__dirname, 'dist', 'generated', 'prisma', 'client.js'));
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv/config');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

prisma.prestataire
  .update({
    where: { id: '75b98fcd-6de5-40a9-b98c-11db93abccb3' },
    data: { rdvGratuitsRestants: 10 },
  })
  .then((r) => {
    console.log('Quota remis a', r.rdvGratuitsRestants);
    return prisma.$disconnect();
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
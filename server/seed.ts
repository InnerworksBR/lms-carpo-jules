import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const password_hash = await bcrypt.hash('password123', 8)

  const user = await prisma.user.upsert({
    where: { email: 'admin@lms.com' },
    update: {},
    create: {
      email: 'admin@lms.com',
      name: 'Admin User',
      password_hash,
      role: 'ADMIN'
    }
  })

  console.log('Admin user created:', user.email)
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())

import Fastify from 'fastify'
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const fastify = Fastify({
  logger: true
})

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

fastify.get('/', async (request, reply) => {
  return { hello: 'world' }
})

fastify.get('/users', async (request, reply) => {
  const users = await prisma.user.findMany()
  return users
})

const start = async () => {
  try {
    await fastify.listen({ port: 3333, host: '0.0.0.0' })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()

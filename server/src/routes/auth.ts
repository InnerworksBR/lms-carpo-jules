import type { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { z } from 'zod'

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/register', async (request, reply) => {
    const registerSchema = z.object({
      name: z.string(),
      email: z.string().email(),
      password: z.string().min(6),
      role: z.enum(['ADMIN', 'STUDENT']).optional()
    })

    const { name, email, password, role } = registerSchema.parse(request.body)

    const userExists = await prisma.user.findUnique({
      where: { email }
    })

    if (userExists) {
      return reply.status(400).send({ message: 'User already exists' })
    }

    const password_hash = await bcrypt.hash(password, 8)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash,
        role: role || 'STUDENT'
      }
    })

    return reply.status(201).send({ id: user.id, name: user.name, email: user.email })
  })

  fastify.post('/login', async (request, reply) => {
    const loginSchema = z.object({
      email: z.string().email(),
      password: z.string()
    })

    const { email, password } = loginSchema.parse(request.body)

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return reply.status(400).send({ message: 'Invalid credentials' })
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash)

    if (!passwordMatch) {
      return reply.status(400).send({ message: 'Invalid credentials' })
    }

    const token = fastify.jwt.sign({
      role: user.role
    }, {
      sub: user.id,
      expiresIn: '7d'
    })

    return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } }
  })

  fastify.get('/me', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user.sub as string }
    })

    if (!user) {
      return reply.status(404).send({ message: 'User not found' })
    }

    return { id: user.id, name: user.name, email: user.email, role: user.role }
  })
}

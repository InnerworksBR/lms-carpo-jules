import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma.js'
import { z } from 'zod'

export async function moduleRoutes(fastify: FastifyInstance) {
  // Create module
  fastify.post('/', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({ message: 'Forbidden' })
    }

    const bodySchema = z.object({
      title: z.string(),
      course_id: z.string().uuid()
    })

    const { title, course_id } = bodySchema.parse(request.body)

    const module = await prisma.module.create({
      data: {
        title,
        course_id
      }
    })

    return reply.status(201).send(module)
  })

  // Update module
  fastify.put('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({ message: 'Forbidden' })
    }

    const paramsSchema = z.object({
      id: z.string().uuid()
    })
    const { id } = paramsSchema.parse(request.params)

    const bodySchema = z.object({
      title: z.string()
    })

    const { title } = bodySchema.parse(request.body)

    const module = await prisma.module.update({
      where: { id },
      data: { title }
    })

    return module
  })

  // Delete module
  fastify.delete('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({ message: 'Forbidden' })
    }

    const paramsSchema = z.object({
      id: z.string().uuid()
    })
    const { id } = paramsSchema.parse(request.params)

    await prisma.module.delete({
      where: { id }
    })

    return reply.status(204).send()
  })
}

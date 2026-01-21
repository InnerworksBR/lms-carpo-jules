import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma.js'
import { z } from 'zod'

export async function lessonRoutes(fastify: FastifyInstance) {
  // Create lesson
  fastify.post('/', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({ message: 'Forbidden' })
    }

    const bodySchema = z.object({
      title: z.string(),
      module_id: z.string().uuid(),
      video_url: z.string().optional(),
      content_text: z.string().optional(),
      duration: z.number().optional()
    })

    const data = bodySchema.parse(request.body)

    const lesson = await prisma.lesson.create({
      data
    })

    return reply.status(201).send(lesson)
  })

  // Get lesson by ID
  fastify.get('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid()
    })
    const { id } = paramsSchema.parse(request.params)

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        module: {
          include: {
            course: true
          }
        }
      }
    })

    if (!lesson) {
      return reply.status(404).send({ message: 'Lesson not found' })
    }

    return lesson
  })

  // Update lesson
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
      title: z.string().optional(),
      video_url: z.string().optional(),
      content_text: z.string().optional(),
      duration: z.number().optional()
    })

    const data = bodySchema.parse(request.body)

    const lesson = await prisma.lesson.update({
      where: { id },
      data
    })

    return lesson
  })

  // Delete lesson
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

    await prisma.lesson.delete({
      where: { id }
    })

    return reply.status(204).send()
  })
}

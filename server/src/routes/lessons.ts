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
      video_url: z.string().optional(),
      content_text: z.string().optional(),
      duration: z.number().optional(),
      module_id: z.string().uuid()
    })

    const { title, video_url, content_text, duration, module_id } = bodySchema.parse(request.body)

    const lesson = await prisma.lesson.create({
      data: {
        title,
        video_url,
        content_text,
        duration,
        module_id
      }
    })

    return reply.status(201).send(lesson)
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

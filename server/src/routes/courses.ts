import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma.js'
import { z } from 'zod'

export async function courseRoutes(fastify: FastifyInstance) {
  // List all courses
  fastify.get('/', async (request, reply) => {
    const courses = await prisma.course.findMany({
      include: {
        _count: {
          select: { modules: true }
        }
      }
    })

    // Try to get enrollment info if user is authenticated
    let user: any = null
    try {
      user = await request.jwtVerify()
    } catch (err) {
      // Not authenticated, just return courses without enrollment info
      return courses
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { user_id: user.sub }
    })

    const coursesWithEnrollment = courses.map(course => {
      const enrollment = enrollments.find(e => e.course_id === course.id)
      return {
        ...course,
        is_enrolled: !!enrollment,
        completed_at: enrollment?.completed_at || null
      }
    })

    return coursesWithEnrollment
  })

  // Enroll in a course
  fastify.post('/:id/enroll', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid()
    })
    const { id } = paramsSchema.parse(request.params)

    const course = await prisma.course.findUnique({
      where: { id }
    })

    if (!course) {
      return reply.status(404).send({ message: 'Course not found' })
    }

    const enrollment = await prisma.enrollment.upsert({
      where: {
        user_id_course_id: {
          user_id: request.user.sub,
          course_id: id
        }
      },
      update: {},
      create: {
        user_id: request.user.sub,
        course_id: id
      }
    })

    return reply.status(201).send(enrollment)
  })

  // Get course by ID
  fastify.get('/:id', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid()
    })
    const { id } = paramsSchema.parse(request.params)

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          include: {
            lessons: true
          }
        }
      }
    })

    if (!course) {
      return reply.status(404).send({ message: 'Course not found' })
    }

    return course
  })

  // Create course (Admin only)
  fastify.post('/', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    // Check role
    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({ message: 'Forbidden' })
    }

    const bodySchema = z.object({
      title: z.string(),
      description: z.string(),
      cover_url: z.string().optional()
    })

    const { title, description, cover_url } = bodySchema.parse(request.body)

    const course = await prisma.course.create({
      data: {
        title,
        description,
        cover_url
      }
    })

    return reply.status(201).send(course)
  })

  // Update course
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
      description: z.string().optional(),
      cover_url: z.string().optional()
    })

    const data = bodySchema.parse(request.body)

    const course = await prisma.course.update({
      where: { id },
      data
    })

    return course
  })

  // Delete course
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

    // Delete modules and lessons first or use cascade if configured in Prisma
    // For now, let's just delete the course (Prisma might throw if relations exist and not cascaded)
    await prisma.course.delete({
      where: { id }
    })

    return reply.status(204).send()
  })
}

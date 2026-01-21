import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma.js'
import { z } from 'zod'

export async function courseRoutes(fastify: FastifyInstance) {
  // List all courses
   fastify.get('/', {
     onRequest: [fastify.authenticate]
   }, async (request, reply) => {
     const userId = request.user.sub as string

    const courses = await prisma.course.findMany({
      include: {
        _count: {
          select: { modules: true }
         },
         enrollments: {
           where: { user_id: userId },
           select: { user_id: true }
         },
         modules: {
           include: {
             lessons: {
               include: {
                 progress: {
                   where: { user_id: userId }
                 }
               }
             }
           }
        }
      }
    })

     const coursesWithData = courses.map(course => {
       const totalLessons = course.modules.reduce((acc, mod) => acc + mod.lessons.length, 0)
       const completedLessons = course.modules.reduce((acc, mod) => {
         return acc + mod.lessons.filter(lesson => lesson.progress.some(p => p.is_completed)).length
       }, 0)
       const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

       return {
         id: course.id,
         title: course.title,
         description: course.description,
         cover_url: course.cover_url,
         _count: course._count,
         is_enrolled: course.enrollments.length > 0,
         progress: {
           percentage
         }
       }
     })

     return coursesWithData
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

   // Enroll in course
   fastify.post('/:id/enroll', {
     onRequest: [fastify.authenticate]
   }, async (request, reply) => {
     const paramsSchema = z.object({
       id: z.string().uuid()
     })
     const { id } = paramsSchema.parse(request.params)
     const userId = request.user.sub as string

     const enrollment = await prisma.enrollment.upsert({
       where: {
         user_id_course_id: {
           user_id: userId,
           course_id: id
         }
       },
       update: {},
       create: {
         user_id: userId,
         course_id: id
       }
     })

     return enrollment
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

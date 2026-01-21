import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma.js'
import { z } from 'zod'

export async function userRoutes(fastify: FastifyInstance) {
  // List all users with their enrollment count and average progress (Admin only)
  fastify.get('/', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({ message: 'Forbidden' })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        enrollments: {
          select: {
            course_id: true,
            course: {
              select: {
                title: true
              }
            }
          }
        },
        _count: {
          select: {
            progress: true
          }
        }
      }
    })

    return users
  })

  // Get user details and detailed progress (Admin only)
  fastify.get('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({ message: 'Forbidden' })
    }

    const paramsSchema = z.object({
      id: z.string().uuid()
    })
    const { id } = paramsSchema.parse(request.params)

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        enrollments: {
          include: {
            course: {
              include: {
                _count: {
                  select: {
                    modules: true
                  }
                },
                modules: {
                  include: {
                    lessons: true
                  }
                }
              }
            }
          }
        },
        progress: true
      }
    })

    if (!user) {
      return reply.status(404).send({ message: 'User not found' })
    }

    // Calculate progress per course
    const courseProgress = user.enrollments.map(enrollment => {
      const course = enrollment.course
      const totalLessons = course.modules.reduce((acc, mod) => acc + mod.lessons.length, 0)
      const courseLessonsIds = course.modules.flatMap(mod => mod.lessons.map(l => l.id))
      const completedLessons = user.progress.filter(p => courseLessonsIds.includes(p.lesson_id) && p.is_completed).length

      return {
        course_id: course.id,
        title: course.title,
        percentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
        completed_at: enrollment.completed_at
      }
    })

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      courseProgress
    }
  })
}

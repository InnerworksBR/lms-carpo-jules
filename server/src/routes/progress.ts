import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma.js'
import { z } from 'zod'

export async function progressRoutes(fastify: FastifyInstance) {
  // Mark a lesson as completed
  fastify.post('/lesson/:lessonId', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const paramsSchema = z.object({
      lessonId: z.string().uuid()
    })

    const { lessonId } = paramsSchema.parse(request.params)

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          select: { course_id: true }
        }
      }
    })

    if (!lesson) {
      return reply.status(404).send({ message: 'Lesson not found' })
    }

    // Upsert progress
    await prisma.progress.upsert({
      where: {
        user_id_lesson_id: {
          user_id: request.user.sub,
          lesson_id: lessonId
        }
      },
      update: {
        is_completed: true
      },
      create: {
        user_id: request.user.sub,
        lesson_id: lessonId,
        is_completed: true
      }
    })

    // Check if all lessons in the course are completed to mark enrollment as completed
    const courseId = lesson.module.course_id

    const totalLessons = await prisma.lesson.count({
      where: {
        module: {
          course_id: courseId
        }
      }
    })

    const completedLessons = await prisma.progress.count({
      where: {
        user_id: request.user.sub,
        is_completed: true,
        lesson: {
          module: {
            course_id: courseId
          }
        }
      }
    })

    if (totalLessons > 0 && totalLessons === completedLessons) {
      await prisma.enrollment.update({
        where: {
          user_id_course_id: {
            user_id: request.user.sub,
            course_id: courseId
          }
        },
        data: {
          completed_at: new Date()
        }
      })
    }

    return reply.status(204).send()
  })

  // Get progress for a specific course
  fastify.get('/course/:courseId', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const paramsSchema = z.object({
      courseId: z.string().uuid()
    })

    const { courseId } = paramsSchema.parse(request.params)

    const completedLessons = await prisma.progress.findMany({
      where: {
        user_id: request.user.sub,
        is_completed: true,
        lesson: {
          module: {
            course_id: courseId
          }
        }
      },
      select: {
        lesson_id: true
      }
    })

    return completedLessons.map((p: any) => p.lesson_id)
  })
}

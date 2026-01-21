import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma.js'
import { z } from 'zod'

export async function progressRoutes(fastify: FastifyInstance) {
  // Mark lesson as completed
  fastify.post('/lesson/:lessonId', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const paramsSchema = z.object({
      lessonId: z.string().uuid()
    })
    const { lessonId } = paramsSchema.parse(request.params)
    const userId = request.user.sub as string

    const progress = await prisma.progress.upsert({
      where: {
        user_id_lesson_id: {
          user_id: userId,
          lesson_id: lessonId
        }
      },
      update: {
        is_completed: true
      },
      create: {
        user_id: userId,
        lesson_id: lessonId,
        is_completed: true
      }
    })

    return progress
  })

  // Get user progress for a course
  fastify.get('/course/:courseId', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const paramsSchema = z.object({
      courseId: z.string().uuid()
    })
    const { courseId } = paramsSchema.parse(request.params)
    const userId = request.user.sub as string

    const lessons = await prisma.lesson.findMany({
      where: {
        module: {
          course_id: courseId
        }
      },
      select: {
        id: true
      }
    })

    const lessonIds = lessons.map(l => l.id)

    const progress = await prisma.progress.findMany({
      where: {
        user_id: userId,
        lesson_id: {
          in: lessonIds
        },
        is_completed: true
      }
    })

    const totalLessons = lessonIds.length
    const completedLessons = progress.length
    const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

    return {
      completedLessons,
      totalLessons,
      percentage,
      completedLessonIds: progress.map(p => p.lesson_id)
    }
  })
}

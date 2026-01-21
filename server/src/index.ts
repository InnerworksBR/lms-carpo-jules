import Fastify from 'fastify'
import jwt from '@fastify/jwt'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { authRoutes } from './routes/auth.js'
import { courseRoutes } from './routes/courses.js'
import { moduleRoutes } from './routes/modules.js'
import { lessonRoutes } from './routes/lessons.js'
import { uploadRoutes } from './routes/upload.js'
import { progressRoutes } from './routes/progress.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uploadsDir = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const fastify = Fastify({
  logger: true
})

if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET is not set, using default for development')
}

// Plugins
fastify.register(cors, {
  origin: true
})

fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'supersecret'
})

fastify.decorate('authenticate', async (request: any, reply: any) => {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.send(err)
  }
})

fastify.register(multipart)

fastify.register(fastifyStatic, {
  root: uploadsDir,
  prefix: '/uploads/',
})

// Routes
fastify.register(authRoutes, { prefix: '/auth' })
fastify.register(courseRoutes, { prefix: '/courses' })
fastify.register(moduleRoutes, { prefix: '/modules' })
fastify.register(lessonRoutes, { prefix: '/lessons' })
fastify.register(uploadRoutes, { prefix: '/upload' })
fastify.register(progressRoutes, { prefix: '/progress' })

fastify.get('/', async () => {
  return { status: 'ok', version: '1.0.0' }
})

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3333
    const host = process.env.HOST || '0.0.0.0'
    await fastify.listen({ port, host })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()

import type { FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'
import { pipeline } from 'node:stream'
import { promisify } from 'node:util'
import { createWriteStream } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const pump = promisify(pipeline)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export async function uploadRoutes(fastify: FastifyInstance) {
  fastify.post('/', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({ message: 'Forbidden' })
    }

    const data = await request.file()

    if (!data) {
      return reply.status(400).send({ message: 'No file uploaded' })
    }

    const extension = path.extname(data.filename)
    const fileId = randomUUID()
    const fileName = `${fileId}${extension}`

    const uploadPath = path.resolve(__dirname, '../../uploads', fileName)

    await pump(data.file, createWriteStream(uploadPath))

    const baseUrl = `${request.protocol}://${request.hostname}`
    const fileUrl = `${baseUrl}/uploads/${fileName}`

    return { fileUrl }
  })
}

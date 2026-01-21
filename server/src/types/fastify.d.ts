import '@fastify/jwt'
import 'fastify'

declare module 'fastify' {
  export interface FastifyInstance {
    authenticate: any
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      sub: string
      role: 'ADMIN' | 'STUDENT'
    }
  }
}

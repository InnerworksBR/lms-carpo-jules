import 'fastify'

declare module 'fastify' {
  interface FastifyInstance {
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

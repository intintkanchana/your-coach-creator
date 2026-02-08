import { FastifyInstance } from 'fastify';
import { authService } from '../services/auth';

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/api/auth/login', {
    schema: {
      description: 'Login with Google ID Token',
      tags: ['Auth'],
      body: {
        type: 'object',
        properties: {
          token: { type: 'string' }
        },
        required: ['token']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                google_id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                picture: { type: 'string' }
              }
            },
            sessionToken: { type: 'string' }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { token } = request.body as { token: string };

    if (!token) {
      return reply.status(400).send({ error: 'Token is required' });
    }

    try {
      const googleUser = await authService.verifyGoogleToken(token);
      const user = await authService.loginUser(googleUser);
      return { user, sessionToken: user.session_token };
    } catch (error) {
      request.log.error(error);
      return reply.status(401).send({ error: 'Authentication failed' });
    }
  });
}

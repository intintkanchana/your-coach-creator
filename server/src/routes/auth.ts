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

  fastify.post('/api/auth/guest-login', {
    schema: {
      description: 'Login as Guest',
      tags: ['Auth'],
      body: {
        type: 'object',
        properties: {
          nickname: { type: 'string' }
        },
        required: ['nickname']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                google_id: { type: 'string', nullable: true },
                email: { type: 'string', nullable: true },
                name: { type: 'string' },
                picture: { type: 'string', nullable: true }
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
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { nickname } = request.body as { nickname: string };

    if (!nickname || nickname.trim().length === 0) {
      return reply.status(400).send({ error: 'Nickname is required' });
    }

    try {
      const user = await authService.loginGuest(nickname);
      return { user, sessionToken: user.session_token };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Guest login failed' });
    }
  });
}

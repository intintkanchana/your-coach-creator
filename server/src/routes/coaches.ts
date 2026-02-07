import { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth';
import { coachService } from '../services/coach';

export async function coachRoutes(fastify: FastifyInstance) {
  // Apply middleware to all routes in this plugin? 
  // Easier to apply per route or scope.
  
  fastify.get('/api/coaches', { 
    preHandler: requireAuth,
    schema: {
      description: 'Get list of coaches',
      tags: ['Coaches'],
      security: [{ apiKey: [] }],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              type: { type: 'string' },
              icon: { type: 'string' },
              created_at: { type: 'string' },
              goal: { type: 'string' },
              bio: { type: 'string' },
              vital_signs: { type: 'string' }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const user = request.user!;
    const coaches = coachService.getCoachesByUser(user.id);
    return coaches;
  });

  fastify.get('/api/coaches/:id', {
    preHandler: requireAuth,
    schema: {
      description: 'Get a specific coach',
      tags: ['Coaches'],
      security: [{ apiKey: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            type: { type: 'string' },
            system_instruction: { type: 'string' },
            icon: { type: 'string' },
            user_id: { type: 'number' },
            created_at: { type: 'string' },
            goal: { type: 'string' },
            bio: { type: 'string' },
            vital_signs: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const user = request.user!;
    const { id } = request.params as { id: number };

    const coach = coachService.getCoachById(id);
    
    if (!coach || coach.user_id !== user.id) {
      return reply.status(404).send({ error: 'Coach not found' });
    }

    return coach;
  });

  fastify.post('/api/coaches', { 
    preHandler: requireAuth,
    schema: {
      description: 'Create a new coach',
      tags: ['Coaches'],
      security: [{ apiKey: [] }],
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { type: 'string' },
          context: { type: 'string' },
          icon: { type: 'string' }
        },
        required: ['name', 'type']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            type: { type: 'string' },
            system_instruction: { type: 'string' },
            icon: { type: 'string' },
            user_id: { type: 'number' }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const user = request.user!;
    const { name, type, context, icon } = request.body as { name: string; type: string; context?: string; icon?: string }; // 'context' mapped to system_instruction

    if (!name || !type) {
      return reply.status(400).send({ error: 'Name and Type are required' });
    }

    const coach = coachService.createCoach({
      name,
      type,
      system_instruction: context,
      icon,
      user_id: user.id
    });

    return coach;
  });

  fastify.delete('/api/coaches/:id', {
    preHandler: requireAuth,
    schema: {
      description: 'Delete a coach',
      tags: ['Coaches'],
      security: [{ apiKey: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const user = request.user!;
    const { id } = request.params as { id: number };

    // Validate if coach exists and belongs to user
    const coach = coachService.getCoachById(id);
    if (!coach || coach.user_id !== user.id) {
      return reply.status(404).send({ error: 'Coach not found' });
    }

    coachService.deleteCoach(id, user.id);
    return { success: true };
  });
}

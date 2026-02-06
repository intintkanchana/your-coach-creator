import { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth';
import { chatService } from '../services/chat';
import { coachService } from '../services/coach';
import { geminiService } from '../services/gemini';

export async function chatRoutes(fastify: FastifyInstance) {
  fastify.post('/api/chat', { 
    preHandler: requireAuth,
    schema: {
      description: 'Send a message to a coach',
      tags: ['Chat'],
      security: [{ apiKey: [] }],
      body: {
        type: 'object',
        properties: {
          coachId: { type: 'number' },
          message: { type: 'string' }
        },
        required: ['coachId', 'message']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            response: { type: 'string' }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        403: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        404: {
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
    const user = request.user!;
    const { coachId, message } = request.body as { coachId: number; message: string };

    if (!coachId || !message) {
      return reply.status(400).send({ error: 'coachId and message are required' });
    }

    const coach = coachService.getCoachById(coachId);
    if (!coach) {
      return reply.status(404).send({ error: 'Coach not found' });
    }
    if (coach.user_id !== user.id) {
       return reply.status(403).send({ error: 'This is not your coach' });
    }

    // 1. Get History
    const history = chatService.getHistory(coachId, user.id);

    // 2. Chat with Gemini
    let responseText = '';
    try {
      responseText = await geminiService.chat(history, message, coach.system_instruction);
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Failed to communicate with AI' });
    }

    // 3. Save User Message
    chatService.saveMessage(coachId, user.id, 'user', message);

    // 4. Save AI Response
    chatService.saveMessage(coachId, user.id, 'model', responseText);

    return { response: responseText };
  });
}

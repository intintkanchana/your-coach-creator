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

    const coach = await coachService.getCoachById(coachId);
    if (!coach) {
      return reply.status(404).send({ error: 'Coach not found' });
    }
    if (coach.user_id !== user.id) {
       return reply.status(403).send({ error: 'This is not your coach' });
    }

    // 1. Get History
    const history = await chatService.getHistory(coachId, user.id);

    // 2. Chat with Gemini
    let responseText = '';
    try {
      responseText = await geminiService.chat(history, message, coach.system_instruction);
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Failed to communicate with AI' });
    }

    // 3. Save User Message
    await chatService.saveMessage(coachId, user.id, 'user', message);

    // 4. Save AI Response
    await chatService.saveMessage(coachId, user.id, 'model', responseText);

    return { response: responseText };
  });

  fastify.post('/api/chat/greeting', {
    preHandler: requireAuth,
    schema: {
      description: 'Get a greeting from the coach',
      tags: ['Chat'],
      security: [{ apiKey: [] }],
      body: {
        type: 'object',
        properties: {
          coachId: { type: 'number' }
        },
        required: ['coachId']
      }
    }
  }, async (request, reply) => {
    const user = request.user!;
    const { coachId } = request.body as { coachId: number };

    const coach = await coachService.getCoachById(coachId);
    if (!coach || coach.user_id !== user.id) {
      return reply.status(404).send({ error: 'Coach not found' });
    }

    const lastLog = await chatService.getLastActivityLog(coachId, user.id);
    try {
      const greetingJson = await chatService.generateGreeting(coach, lastLog);
      return JSON.parse(greetingJson);
    } catch (e) {
      request.log.error(e);
      return reply.status(500).send({ error: 'Failed to generate greeting' });
    }
  });

  fastify.post('/api/chat/classify', {
    preHandler: requireAuth,
    schema: {
      description: 'Classify user intention',
      tags: ['Chat'],
      security: [{ apiKey: [] }],
      body: {
        type: 'object',
        properties: {
          coachId: { type: 'number' },
          message: { type: 'string' }
        },
        required: ['coachId', 'message']
      }
    }
  }, async (request, reply) => {
    const user = request.user!;
    const { coachId, message } = request.body as { coachId: number; message: string };

    const coach = await coachService.getCoachById(coachId);
    if (!coach || coach.user_id !== user.id) {
      return reply.status(404).send({ error: 'Coach not found' });
    }

    // Save user message first
    await chatService.saveMessage(coachId, user.id, 'user', message);

    try {
      const classificationJson = await chatService.classifyIntention(coach, message);
      const result = JSON.parse(classificationJson);
      
      // If it's a general consult, save the response as a model message
      if (result.intention === 'GENERAL_CONSULT' && result.response_text) {
        await chatService.saveMessage(coachId, user.id, 'model', result.response_text);
      }

      // Include coach tracking data in the response
      if (coach.trackings) {
        result.trackings = coach.trackings;
      }

      return result;
    } catch (e) {
      request.log.error(e);
      return reply.status(500).send({ error: 'Failed to classify message' });
    }
  });

  fastify.post('/api/chat/analyze', {
    preHandler: requireAuth,
    schema: {
      description: 'Analyze activity log',
      tags: ['Chat'],
      security: [{ apiKey: [] }],
      body: {
        type: 'object',
        properties: {
          coachId: { type: 'number' },
          logData: { type: 'object' }
        },
        required: ['coachId', 'logData']
      }
    }
  }, async (request, reply) => {
    const user = request.user!;
    const { coachId, logData } = request.body as { coachId: number; logData: any };

    const coach = await coachService.getCoachById(coachId);
    if (!coach || coach.user_id !== user.id) {
      return reply.status(404).send({ error: 'Coach not found' });
    }

    try {
      const analysisJson = await chatService.analyzeActivityLog(coach, logData, user.id);
      
      // Save the log and feedback
      await chatService.saveActivityLog(coachId, user.id, JSON.stringify(logData), analysisJson);
      
      // Also save as a chat message for context? 
      // Maybe just the summary or a "Log submitted" system message + Coach feedback
      // specific feedback is complex to store in simple chat history, staying with activity_logs for now.
      // But we should probably add a model message so chat history sees the response.
      
      const result = JSON.parse(analysisJson);
      if (result.analysis && result.analysis.summary_impression) {
          await chatService.saveMessage(coachId, user.id, 'model', result.analysis.summary_impression);
      }

      return result;
    } catch (e) {
      request.log.error(e);
      return reply.status(500).send({ error: 'Failed to analyze log' });
    }
  });
}

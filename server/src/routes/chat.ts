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
      const result = JSON.parse(greetingJson);

      // Save greeting message to history
      if (result.greeting_text) {
        await chatService.saveMessage(coachId, user.id, 'model', result.greeting_text);
      }

      // Save question message to history
      if (result.question_text) {
        // Add a small delay for timestamp ordering if needed, but usually fine in same second
        // To be safe, we could use a slightly adjusted timestamp if we were manually setting it,
        // but the DB likely uses CURRENT_TIMESTAMP. 
        // We'll just await the first one to ensure order.
        await chatService.saveMessage(coachId, user.id, 'model', result.question_text);
      }

      return result;
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

      // ONLY include coach tracking data if intention is LOG_NEW_ACTIVITY
      if (result.intention === 'LOG_NEW_ACTIVITY' && coach.trackings) {
        result.trackings = coach.trackings;
      }

      // If it's a log activity, save the form request
      // Check for intention explicitly, or if trackings were attached (which implies log activity now)
      if (result.intention === 'LOG_NEW_ACTIVITY') {
        // Construct the form request message
        const formRequest = {
          timestamp: new Date().toISOString(),
          status: 'REQUESTED'
        };
        await chatService.saveMessage(coachId, user.id, 'model', `JSON_FORM_REQUEST:${JSON.stringify(formRequest)}`);
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
          logData: { type: 'object' },
          summaryText: { type: 'string' }
        },
        required: ['coachId', 'logData']
      }
    }
  }, async (request, reply) => {
    const user = request.user!;
    const { coachId, logData, summaryText } = request.body as { coachId: number; logData: any; summaryText?: string };

    const coach = await coachService.getCoachById(coachId);
    if (!coach || coach.user_id !== user.id) {
      return reply.status(404).send({ error: 'Coach not found' });
    }

    try {
      // 0. Save User Log Summary (if provided)
      if (summaryText) {
        await chatService.saveMessage(coachId, user.id, 'user', summaryText);
      }

      // 0. Update Last Form Message to SUBMITTED
      // We do this before analysis so history reflects it even if analysis fails (though we should probably do it after success to be safe, but UI optimistic update implies success)
      try {
        const formSubmitted = {
          timestamp: new Date().toISOString(),
          status: 'SUBMITTED',
          formData: logData
        };
        await chatService.updateLastFormMessage(coachId, user.id, `JSON_FORM_SUBMITTED:${JSON.stringify(formSubmitted)}`);
      } catch (e) {
        console.error("Failed to update form message", e);
      }

      const analysisJson = await chatService.analyzeActivityLog(coach, logData, user.id);

      // Save the log and feedback
      await chatService.saveActivityLog(coachId, user.id, JSON.stringify(logData), analysisJson);

      // Also save as a chat message for context? 
      // Maybe just the summary or a "Log submitted" system message + Coach feedback
      // specific feedback is complex to store in simple chat history, staying with activity_logs for now.
      // But we should probably add a model message so chat history sees the response.

      let result;
      try {
        result = JSON.parse(analysisJson);
      } catch (e) {
        console.error("Failed to parse analysis JSON:", analysisJson);
        throw e;
      }

      // Save Full Analysis Data for History
      if (result.analysis) {
        // Use a special prefix to identify JSON data in history
        const jsonContent = `JSON_ANALYSIS:${JSON.stringify(result.analysis)}`;
        await chatService.saveMessage(coachId, user.id, 'model', jsonContent);
      }

      return result;
    } catch (e) {
      request.log.error(e);
      return reply.status(500).send({ error: 'Failed to analyze log' });
    }
  });

  fastify.get('/api/chat/history/:coachId', {
    preHandler: requireAuth,
    schema: {
      description: 'Get full chat history',
      tags: ['Chat'],
      security: [{ apiKey: [] }],
      params: {
        type: 'object',
        properties: {
          coachId: { type: 'number' }
        },
        required: ['coachId']
      }
    }
  }, async (request, reply) => {
    const user = request.user!;
    const { coachId } = request.params as { coachId: number };

    const coach = await coachService.getCoachById(coachId);
    if (!coach || coach.user_id !== user.id) {
      return reply.status(404).send({ error: 'Coach not found' });
    }

    try {
      const history = await chatService.getFullHistory(coachId, user.id);
      return history;
    } catch (e) {
      request.log.error(e);
      return reply.status(500).send({ error: 'Failed to fetch history' });
    }
  });

  fastify.get('/api/chat/logs/:coachId', {
    preHandler: requireAuth,
    schema: {
      description: 'Get all activity logs for a coach',
      tags: ['Chat'],
      security: [{ apiKey: [] }],
      params: {
        type: 'object',
        properties: {
          coachId: { type: 'number' }
        },
        required: ['coachId']
      }
    }
  }, async (request, reply) => {
    const user = request.user!;
    const { coachId } = request.params as { coachId: number };

    // Optimize: Check ownership once?
    // Let's reuse coachService.getCoachById just to be safe about ownership
    const coach = await coachService.getCoachById(coachId);
    if (!coach || coach.user_id !== user.id) {
      return reply.status(404).send({ error: 'Coach not found' });
    }

    try {
      const logs = await chatService.getAllActivityLogs(coachId, user.id);
      return logs;
    } catch (e) {
      request.log.error(e);
      return reply.status(500).send({ error: 'Failed to fetch logs' });
    }
  });
}

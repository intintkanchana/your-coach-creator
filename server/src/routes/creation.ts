import { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth';
import { creationAgentService, CreationStep } from '../services/creation-agent';
import { coachService } from '../services/coach';

export async function creationRoutes(fastify: FastifyInstance) {
  
  // Endpoint to send a message to the agent (triggers generation for current step)
  fastify.post('/api/coach/create/chat', { 
    preHandler: requireAuth,
    schema: {
        description: 'Send a message to the creation agent to generate options',
        tags: ['Creation'],
        security: [{ apiKey: [] }],
        body: {
            type: 'object',
            properties: {
                message: { 
                    description: 'User input or selection from previous step',
                    oneOf: [{ type: 'string' }, { type: 'object' }] 
                },
                reset: { type: 'boolean' }
            }
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    step: { type: 'string' },
                    ui_data: { type: 'object', additionalProperties: true }
                }
            }
        }
    }
  }, async (request, reply) => {
    const user = request.user!;
    const { message, reset } = request.body as { message: any; reset?: boolean };
    
    // Delegate to service
    const result = await creationAgentService.handleMessage(user.id, message, reset);
    return result;
  });

  // Endpoint to advance to the next step (client confirms selection)
  fastify.post('/api/coach/create/advance', { 
    preHandler: requireAuth,
    schema: {
        description: 'Advance the creation workflow to the next step',
        tags: ['Creation'],
        security: [{ apiKey: [] }],
        body: {
            type: 'object',
            properties: {
                nextStep: { type: 'string' },
                data: { type: 'object', additionalProperties: true }
            },
            required: ['nextStep']
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    currentStep: { type: 'string' }
                }
            }
        }
    }
  }, async (request, reply) => {
    const user = request.user!;
    const { nextStep, data } = request.body as { nextStep: CreationStep; data: any };
    
    creationAgentService.advanceStep(user.id, nextStep, data);
    return { success: true, currentStep: nextStep };
  });

  // Endpoint to finalize and save the coach
  fastify.post('/api/coach/create/finalize', { 
    preHandler: requireAuth,
    schema: {
        description: 'Finalize and save the created coach',
        tags: ['Creation'],
        security: [{ apiKey: [] }],
        response: {
            200: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    coach: { 
                        type: 'object',
                        properties: {
                            id: { type: 'number' },
                            name: { type: 'string' },
                            type: { type: 'string' },
                            system_instruction: { type: 'string' },
                            user_id: { type: 'number' },
                            // Add these to match frontend needs
                            bio: { type: 'string' },
                            goal: { type: 'string' },
                            vital_signs: { type: 'array' }
                        }
                    }
                }
            }
        }
    }
  }, async (request, reply) => {
      const user = request.user!;
      const session = creationAgentService.getOrCreateSession(user.id);
      
      // Construct final coach object from session data
      const { 
          coach_name, 
          coach_bio, 
          selected_activity_name, 
          vital_signs,
          // We might have gathered these too, or we can infer/default
          user_goal
      } = session.data;
      
      // We need to map this to our DB schema. 
      // The 'system_instruction' needs to be synthesized or we use the bio + role.
      // For now, we create a simple instruction based on the gathered data.
      
      const systemInstruction = `You are ${coach_name}, a ${selected_activity_name} coach. 
Bio: ${coach_bio}.
Your goal is to help the user track: ${Array.isArray(vital_signs) ? vital_signs.map((v:any) => v.name || v.label).join(', ') : 'their progress'}.`;

      const newCoach = coachService.createCoach({
          user_id: user.id, 
          name: coach_name, 
          type: selected_activity_name, // type
          system_instruction: systemInstruction,
          bio: coach_bio,
          goal: user_goal,
          vital_signs: vital_signs
      });
      
      // Include all the data the frontend might need for the summary
      const responseCoach = {
          ...newCoach,
          // DB might return these, but just in case, or if we want to ensure format
          bio: coach_bio,
          goal: user_goal, // ensuring we pass back what we have
          vital_signs: vital_signs
      };

      // Cleanup session
      creationAgentService.clearSession(user.id);
      
      return { success: true, coach: responseCoach };
  });
}

import { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../services/auth';

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: number;
      google_id: string;
      email: string;
      name: string;
    };
  }
}

export const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
  const authHeader = request.headers.authorization;
  
  if (!authHeader) {
    return reply.status(401).send({ error: 'Unauthorized: No token provided' });
  }

  // Expect "Bearer <token>"
  const token = authHeader.replace('Bearer ', '');
  const user = await authService.getUserByToken(token);

  if (!user) {
    return reply.status(401).send({ error: 'Unauthorized: Invalid token' });
  }

  request.user = user;
};

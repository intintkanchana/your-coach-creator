import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { CONFIG } from './config';
import { initDb } from './db';
import { authRoutes } from './routes/auth';
import { coachRoutes } from './routes/coaches';
import { chatRoutes } from './routes/chat';

import { creationRoutes } from './routes/creation';

const fastify = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

// Register CORS
fastify.register(cors, { 
  // Allow all origins for simplicity in development, restrict in prod if needed
  origin: true,
  credentials: true
});

// Register Swagger
fastify.register(fastifySwagger, {
  swagger: {
    info: {
      title: 'Life Coach API',
      description: 'API for AI Life Coach Application',
      version: '1.0.0'
    },
    securityDefinitions: {
      apiKey: {
        type: 'apiKey',
        name: 'Authorization',
        in: 'header'
      }
    }
  }
});

fastify.register(fastifySwaggerUi, {
  routePrefix: '/documentation',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false
  },
});

// Register Routes
fastify.register(authRoutes);
fastify.register(coachRoutes);
fastify.register(chatRoutes);
fastify.register(creationRoutes);

const start = async () => {
  try {
    // Initialize DB
    initDb();
    
    await fastify.listen({ port: Number(CONFIG.PORT), host: '0.0.0.0' });
    console.log(`Server is running at http://localhost:${CONFIG.PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

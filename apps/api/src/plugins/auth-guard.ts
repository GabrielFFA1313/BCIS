import type { FastifyRequest, FastifyReply } from "fastify";

// Extend Fastify's request type so TypeScript knows about `request.user`
declare module "fastify" {
  interface FastifyRequest {
    authUser?: {
      sub: number;
      username: string;
      roles: string[];
      permissions: string[];
    };
  }
}

/**
 * Verifies the JWT on the request and attaches the decoded payload to request.authUser.
 * Use as a preHandler on any route that requires a logged-in user.
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const payload = await request.jwtVerify<{
      sub: number;
      username: string;
      roles: string[];
      permissions: string[];
    }>();
    request.authUser = payload;
  } catch {
    return reply.status(401).send({ error: "Unauthorized: invalid or missing token" });
  }
}

/**
 * Returns a preHandler that checks the authenticated user has a specific permission.
 * Must run AFTER `authenticate` in the preHandler chain.
 */
export function requirePermission(permissionKey: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.authUser) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    if (!request.authUser.permissions.includes(permissionKey)) {
      return reply
        .status(403)
        .send({ error: `Forbidden: missing permission '${permissionKey}'` });
    }
  };
}
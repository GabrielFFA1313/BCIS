import type { FastifyInstance } from "fastify";
import argon2 from "argon2";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { users, userRoles, roles, rolePermissions, permissions } from "../db/schema.js";

export async function authRoutes(app: FastifyInstance) {
  app.post<{ Body: { username: string; password: string } }>(
    "/auth/login",
    async (request, reply) => {
      const { username, password } = request.body;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, username));

      if (!user || !user.isActive) {
        return reply.status(401).send({ error: "Invalid username or password" });
      }

      const passwordValid = await argon2.verify(user.passwordHash, password);
      if (!passwordValid) {
        return reply.status(401).send({ error: "Invalid username or password" });
      }

      // fetch this user's roles
      const userRoleRows = await db
        .select({ roleName: roles.name })
        .from(userRoles)
        .innerJoin(roles, eq(roles.id, userRoles.roleId))
        .where(eq(userRoles.userId, user.id));
      const roleNames = userRoleRows.map((r) => r.roleName);

      // fetch this user's permissions (via their roles)
      const permissionRows = await db
        .select({ key: permissions.key })
        .from(userRoles)
        .innerJoin(rolePermissions, eq(rolePermissions.roleId, userRoles.roleId))
        .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
        .where(eq(userRoles.userId, user.id));
      const permissionKeys = [...new Set(permissionRows.map((p) => p.key))];

      const token = app.jwt.sign(
        {
          sub: user.id,
          username: user.username,
          roles: roleNames,
          permissions: permissionKeys,
        },
        { expiresIn: "8h" }
      );

      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          roles: roleNames,
          permissions: permissionKeys,
        },
      };
    }
  );

  app.post("/auth/logout", async () => {
    // Stateless JWT: logout is handled client-side by discarding the token.
    return { status: "ok" };
  });
}
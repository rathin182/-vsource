import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function validateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    include: {
      role: {
        include: {
          modulePermissions: {
            include: {
              module: true,
            },
          },
        },
      },
      branches: true,
    },
  });

  if (!user) {
    return null;
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return null;
  }

  return user;
}

export async function getCurrentUser() {
  const token = (await cookies()).get("access_token")?.value;

  if (!token) return null;

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  const { payload } = await jwtVerify(token, secret);

  return {
    id: payload.sub as string,
    roleId: payload.roleId as string,
  };
}

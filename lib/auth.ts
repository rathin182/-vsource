import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

/**
 * Validates a user's credentials against the database.
 * Returns the user object (minus the password) on success, or null on failure.
 */
export async function validateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      role: true,
    },
  });

  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return null;
  }

  // Omit password from the returned object
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

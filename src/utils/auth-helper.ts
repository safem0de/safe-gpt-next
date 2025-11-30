// utils/auth-helper.ts
// Helper functions for authentication and authorization

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

/**
 * Get authenticated user from session
 * @returns User ID (email or name) if authenticated, null otherwise
 */
export async function getAuthenticatedUser(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return null;
    }

    // Use email as primary identifier, fallback to name
    const userId = session.user.email || session.user.name;

    if (!userId) {
      return null;
    }

    return userId;
  } catch (error) {
    console.error("Error getting authenticated user:", error);
    return null;
  }
}

/**
 * Require authentication - returns 401 if not authenticated
 * @returns User ID if authenticated, or NextResponse with 401 error
 */
export async function requireAuth(): Promise<
  string | NextResponse
> {
  const userId = await getAuthenticatedUser();

  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized - Please sign in",
        code: "UNAUTHORIZED",
      },
      { status: 401 }
    );
  }

  return userId;
}

/**
 * Check if user is authenticated
 * @returns true if authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  const userId = await getAuthenticatedUser();
  return userId !== null;
}

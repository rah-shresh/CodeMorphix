"use server";

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { error: "All fields are required." };
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return { error: "An account with this email already exists." };
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in DB
    await db.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        credits: 20, // default credits
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Signup registration error:", error);
    return { error: "An error occurred during registration. Please try again." };
  }
}

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get("email") as string;
  if (!email) {
    return { error: "Email is required." };
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Log on server for verification
  console.log(`[AUTH-DEBUG] Password reset request received for email: ${normalizedEmail}`);

  // Simulating network latency
  await new Promise((resolve) => setTimeout(resolve, 800));

  return { success: true };
}

export async function upgradeUserToPro(userId: string) {
  if (!userId) {
    return { error: "User ID is required." };
  }

  try {
    await db.user.update({
      where: { id: userId },
      data: {
        stripeSubscriptionId: "sub_mock_" + Math.random().toString(36).substring(2, 10),
        credits: { increment: 1000 },
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Upgrade error:", error);
    return { error: "Failed to upgrade account." };
  }
}

export async function cancelProSubscription(userId: string) {
  if (!userId) {
    return { error: "User ID is required." };
  }

  try {
    await db.user.update({
      where: { id: userId },
      data: {
        stripeSubscriptionId: null,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return { error: "Failed to cancel subscription." };
  }
}

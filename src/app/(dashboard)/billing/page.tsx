import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import BillingClient from "./billing-client";

// Force dynamic execution to query DB fresh on page load
export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const session = await auth();
  
  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Retrieve user full details from DB
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      credits: true,
      stripeSubscriptionId: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <BillingClient
      userId={userId}
      initialCredits={user.credits}
      initialSubId={user.stripeSubscriptionId}
    />
  );
}

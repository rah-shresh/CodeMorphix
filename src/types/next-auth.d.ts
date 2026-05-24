import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      credits: number;
      stripeSubscriptionId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    credits: number;
    stripeSubscriptionId: string | null;
  }
}

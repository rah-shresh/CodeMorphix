export { auth as proxy } from "@/auth";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/translate/:path*",
    "/history/:path*",
    "/billing/:path*",
  ],
};

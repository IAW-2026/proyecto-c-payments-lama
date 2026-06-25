import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Ignora archivos internos de Next
    "/((?!_next|.*\\..*).*)",

    // Siempre corre en API routes
    "/(api|trpc)(.*)",
  ],
};

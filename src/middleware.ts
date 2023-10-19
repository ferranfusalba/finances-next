export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/accounts", "/budgets", "/data", "/settings"],
};

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: Date | null;
  image: string | null;
  password: string | null;
  role: "ADMIN" | "ROLE" | string | null;
  createdAt: Date;
  updatedAt: Date;
}

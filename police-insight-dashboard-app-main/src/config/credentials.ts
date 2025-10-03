// src/config/credentials.ts
export interface TestCredential {
  email: string;
  password: string;
  role: "admin_police" | "sub_police";
}

export const testCredentials: Record<string, TestCredential> = {
  admin: {
    email: "admin@police.gov.in",
    password: "admin123",
    role: "admin_police",
  },
  officer: {
    email: "officer@police.gov.in",
    password: "police123",
    role: "sub_police",
  },
  inspector: {
    email: "inspector@police.gov.in",
    password: "inspect123",
    role: "sub_police",
  },
};

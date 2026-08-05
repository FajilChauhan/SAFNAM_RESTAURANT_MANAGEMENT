import { useEffect } from "react";
import { AuthLayout } from "../components/AuthLayout";
import { LoginForm } from "../components/LoginForm";

export default function LoginPage() {
  useEffect(() => {
    document.title = "Sign In — SAFNAM";
  }, []);

  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}

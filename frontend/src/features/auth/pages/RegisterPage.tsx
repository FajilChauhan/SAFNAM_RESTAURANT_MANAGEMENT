import { useEffect } from "react";
import { AuthLayout } from "../components/AuthLayout";
import { RegisterForm } from "../components/RegisterForm";

export default function RegisterPage() {
  useEffect(() => {
    document.title = "Create Account — SAFNAM";
  }, []);

  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  );
}

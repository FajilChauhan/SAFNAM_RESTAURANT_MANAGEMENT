import { useState } from "react";
import { useForm } from "react-hook-form";
import { Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { AuthLayout } from "../components/AuthLayout";
import { Button, Card, Input } from "@/components/ui";
import { toast } from "@/utils/toast";

const forgotSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ForgotFormValues>({ defaultValues: { email: "" } });

  return (
    <AuthLayout>
      <Card className="space-y-6 border border-gray-200 bg-white/95 shadow-card dark:border-gray-700 dark:bg-gray-900/95">
        <div>
          <h2 className="font-display text-3xl text-gray-900 dark:text-white">Forgot Password</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Enter your email and we&apos;ll help you reset access.</p>
        </div>

        <form
          className="space-y-4"
          onSubmit={handleSubmit((data) => {
            const parsed = forgotSchema.safeParse(data);
            if (!parsed.success) {
              for (const issue of parsed.error.issues) {
                const field = issue.path[0] as keyof ForgotFormValues | undefined;
                if (field) setError(field, { message: issue.message });
              }
              return;
            }
            setSent(true);
            toast.success("Reset flow captured. Backend endpoint can be connected next.");
          })}
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input className="pl-10" placeholder="you@example.com" {...register("email")} />
            </div>
            {errors.email ? <p className="text-sm text-danger">{errors.email.message}</p> : null}
          </div>

          <Button type="submit" className="w-full bg-primary-600 text-white">
            Send Reset Link
          </Button>
          {sent ? <p className="text-sm text-success">Reset flow captured. Backend endpoint can be connected next.</p> : null}
        </form>

        <Link to="/login" className="block text-center text-sm font-semibold text-primary-600 hover:underline">
          Back to Sign In
        </Link>
      </Card>
    </AuthLayout>
  );
}

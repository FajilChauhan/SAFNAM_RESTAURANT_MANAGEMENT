import { useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Lock, Mail, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

import { useLogin } from "../hooks/useLogin";
import { loginSchema, type LoginFormValues } from "../schemas/login.schema";
import { cn } from "@/utils/cn";
import { useRestaurantSettings } from "@/hooks/useRestaurantSettings";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, errorMessage } = useLogin();
  const { settings } = useRestaurantSettings();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit((data) => {
    const parsed = loginSchema.safeParse(data);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof LoginFormValues | undefined;
        if (field) setError(field, { message: issue.message });
      }
      return;
    }

    login({ email: parsed.data.email, password: parsed.data.password });
  });

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
        <p className="text-gray-500 text-sm mt-1">Sign in to your {settings.name} account</p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="text-gray-700 font-medium text-sm mb-1.5 block">Email</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Mail size={16} />
            </span>
            <input
              type="email"
              autoComplete="email"
              className={cn(
                "w-full h-11 pl-10 pr-4 rounded-xl bg-gray-50 border",
                "text-gray-900 placeholder:text-gray-400",
                "focus:outline-none focus:ring-2 transition-colors",
                "dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500",
                errors.email
                  ? "border-red-400 focus:border-red-400 focus:ring-red-400/10"
                  : "border-gray-200 focus:border-amber-500 focus:ring-amber-500/10 dark:border-gray-700"
              )}
              placeholder="you@example.com"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-gray-700 font-medium text-sm mb-1.5 block">Password</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Lock size={16} />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className={cn(
                "w-full h-11 pl-10 pr-10 rounded-xl bg-gray-50 border",
                "text-gray-900 placeholder:text-gray-400",
                "focus:outline-none focus:ring-2 transition-colors",
                "dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500",
                "[&::-ms-reveal]:hidden [&::-webkit-credentials-auto-fill-button]:hidden",
                errors.password
                  ? "border-red-400 focus:border-red-400 focus:ring-red-400/10"
                  : "border-gray-200 focus:border-amber-500 focus:ring-amber-500/10 dark:border-gray-700"
              )}
              placeholder="Enter your password"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.password.message}
            </p>
          )}
          <div className="text-right">
            <Link to="/forgot-password" className="text-amber-600 text-sm font-medium hover:text-amber-700">
              Forgot Password?
            </Link>
          </div>
        </div>

        {errorMessage && (
          <div className="w-full rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm text-red-600">
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="
            flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl
            bg-gradient-to-r from-amber-500 to-amber-600 text-base font-semibold
            text-white shadow-sm hover:shadow-md transition-shadow duration-200
            hover:scale-[1.02] hover:from-amber-600 hover:to-amber-700
            active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60
            disabled:scale-100
          "
        >
          {isLoading ? (
            <>
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

        <p className="text-gray-500 text-sm">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-amber-600 font-semibold hover:underline">
            Register
          </Link>
        </p>

        <p className="text-gray-400 text-xs text-center mt-3">
          Staff members use credentials provided by the administrator
        </p>
      </div>
  );
}

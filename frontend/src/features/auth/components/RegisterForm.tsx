import { useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Lock, Mail, Phone, User, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

import { useRegister } from "../hooks/useRegister";
import { registerSchema, type RegisterFormValues } from "../schemas/register.schema";
import { cn } from "@/utils/cn";
import { useRestaurantSettings } from "@/hooks/useRestaurantSettings";

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerUser, isLoading, errorMessage } = useRegister();
  const { settings } = useRestaurantSettings();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      terms: false,
    } as unknown as RegisterFormValues,
  });

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
        <p className="text-gray-500 text-sm mt-1">Join {settings.name} as a customer</p>
        <p className="mt-1 text-xs text-gray-400">
          Create your account to book tables, order food and enjoy exclusive dining rewards
        </p>
      </div>

      <form
        className="space-y-4"
        onSubmit={handleSubmit((data) => {
          const parsed = registerSchema.safeParse(data);
          if (!parsed.success) {
            for (const issue of parsed.error.issues) {
              const field = issue.path[0] as keyof RegisterFormValues | undefined;
              if (field) setError(field, { message: issue.message });
            }
            return;
          }
          registerUser({
            name: parsed.data.name,
            email: parsed.data.email,
            phone: parsed.data.phone,
            password: parsed.data.password,
          });
        })}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <User size={16} />
            </span>
            <input
              type="text"
              autoComplete="name"
              className={cn(
                "w-full h-11 pl-10 pr-4 rounded-xl bg-gray-50 border",
                "text-gray-900 placeholder:text-gray-400",
                "focus:outline-none focus:ring-2 transition-colors",
                "dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500",
                errors.name
                  ? "border-red-400 focus:border-red-400 focus:ring-red-400/10"
                  : "border-gray-200 focus:border-amber-500 focus:ring-amber-500/10 dark:border-gray-700"
              )}
              placeholder="Your name"
              {...register("name")}
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
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
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Phone size={16} />
            </span>
            <input
              type="tel"
              autoComplete="tel"
              className={cn(
                "w-full h-11 pl-10 pr-4 rounded-xl bg-gray-50 border",
                "text-gray-900 placeholder:text-gray-400",
                "focus:outline-none focus:ring-2 transition-colors",
                "dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500",
                errors.phone
                  ? "border-red-400 focus:border-red-400 focus:ring-red-400/10"
                  : "border-gray-200 focus:border-amber-500 focus:ring-amber-500/10 dark:border-gray-700"
              )}
              placeholder="9876543210"
              {...register("phone")}
            />
          </div>
          {errors.phone && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.phone.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Lock size={16} />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
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
              placeholder="Strong password"
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
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Lock size={16} />
            </span>
            <input
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              className={cn(
                "w-full h-11 pl-10 pr-10 rounded-xl bg-gray-50 border",
                "text-gray-900 placeholder:text-gray-400",
                "focus:outline-none focus:ring-2 transition-colors",
                "dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500",
                "[&::-ms-reveal]:hidden [&::-webkit-credentials-auto-fill-button]:hidden",
                errors.confirmPassword
                  ? "border-red-400 focus:border-red-400 focus:ring-red-400/10"
                  : "border-gray-200 focus:border-amber-500 focus:ring-amber-500/10 dark:border-gray-700"
              )}
              placeholder="Confirm password"
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <label className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-amber-500/10"
            {...register("terms")}
          />
          <span>I agree to Terms &amp; Conditions and Privacy Policy</span>
        </label>
        {errors.terms && (
          <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
            <AlertCircle size={12} />
            {errors.terms.message}
          </p>
        )}

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
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-amber-600 hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}

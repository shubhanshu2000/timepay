// src/components/AuthForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { apiCall, endpoints } from "@/lib/api";

interface AuthFormProps extends React.ComponentPropsWithoutRef<"div"> {
  register?: boolean;
}

interface AuthResponse {
  success: boolean;
  data: {
    user?: {
      id: string;
      name: string;
      email: string;
      role?: string;
    };
    token: string;
  };
  message?: string;
}

export function AuthForm({ className, register }: AuthFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    general?: string;
  }>({});

  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (register && !formData.name?.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password?.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (register) {
        const response = await apiCall<AuthResponse>(
          endpoints.auth.register,
          "POST",
          {
            name: formData.name,
            email: formData.email,
            password: formData.password,
          }
        );

        if (response.success) {
          router.push("/auth/login");
        }
      } else {
        const response = await apiCall<AuthResponse>(
          endpoints.auth.login,
          "POST",
          {
            email: formData.email,
            password: formData.password,
          }
        );

        if (response.success) {
          const { token, user } = response.data;

          if (rememberMe) {
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));
          } else {
            sessionStorage.setItem("token", token);
            sessionStorage.setItem("user", JSON.stringify(user));
          }

          router.push("/dashboard/customers");
        }
      }
    } catch (error: any) {
      setErrors({
        general: error.message || "An error occurred during authentication",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
    // Clear error for the field being changed
    if (errors[id as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [id]: undefined,
      }));
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {register ? "Register" : "Login"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              {/* Show general error if any */}
              {errors.general && (
                <div className="text-sm text-red-500">{errors.general}</div>
              )}

              {register && (
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter Name"
                    value={formData.name}
                    onChange={handleChange}
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <div className="text-sm text-red-500">{errors.name}</div>
                  )}
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter Email"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <div className="text-sm text-red-500">{errors.email}</div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter Password"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? "border-red-500" : ""}
                />
                {errors.password && (
                  <div className="text-sm text-red-500">{errors.password}</div>
                )}
              </div>

              {!register && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) =>
                      setRememberMe(checked as boolean)
                    }
                  />
                  <Label htmlFor="remember">Remember me</Label>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {register ? "Registering..." : "Logging in..."}
                  </div>
                ) : register ? (
                  "Register"
                ) : (
                  "Login"
                )}
              </Button>
            </div>

            {register ? (
              <div className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="underline underline-offset-4"
                >
                  Login
                </Link>
              </div>
            ) : (
              <div className="mt-4 text-center text-sm">
                Don't have an account?{" "}
                <Link
                  href="/auth/register"
                  className="underline underline-offset-4"
                >
                  Register
                </Link>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

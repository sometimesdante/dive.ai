"use client";
import Link from "next/link";
import { login } from "../actions";
import { useState } from "react";
import { X } from "lucide-react";
import Button from "@/ui/base/Button";
import TextInput from "@/ui/base/TextInput";

export default function Login() {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const result = await login(formData);
    if (result?.error) setError(result.error);
  };

  return (
    <>
      <div className="default-height flex items-center justify-center py-12">
        <div className="bg-[#f2f2f2] border border-[#e8e8e8] flex flex-col gap-4 p-6 w-[420px]">
          <p>Come on, what are you waiting for?</p>
          <h2>Dive! is ready for you now.</h2>

          <form className="flex flex-col gap-4 w-full" onSubmit={handleSubmit}>
            <TextInput name="email" type="email" placeholder="Email" />
            <TextInput name="password" type="password" placeholder="Password" />
            <Button type="submit">Login</Button>
            <div className="flex justify-end">
              <span className="underline cursor-pointer">
                Forgot password?
              </span>
            </div>
          </form>

          <p>
            New user?{" "}
            <Link href="/auth/signup" className="underline">
              Sign up here
            </Link>
          </p>
        </div>
      </div>

      {error && (
        <div className="fixed bottom-10 right-10 bg-[#f2f2f2] flex items-center gap-3 px-6 py-3 shadow-lg z-50">
          <p>{error}</p>
          <button onClick={() => setError(null)}>
            <X size={12} />
          </button>
        </div>
      )}
    </>
  );
}

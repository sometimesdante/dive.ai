"use client";

import Link from "next/link";
import { signup } from "../actions";
import { useState } from "react";
import { X } from "lucide-react";
import Button from "@/ui/base/Button";
import TextInput from "@/ui/base/TextInput";

export default function SignUp() {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const result = await signup(formData);
    if (result?.error) setError(result.error);
  };

  return (
    <>
      <div className="default-height flex items-center justify-center py-12">
        <div className="bg-[#f2f2f2] border border-[#e8e8e8] flex flex-col gap-4 p-6 w-[420px]">
          <p>Let&apos;s get you started.</p>
          <h2>Create your Dive! account.</h2>

          <form className="flex flex-col gap-4 w-full" onSubmit={handleSubmit}>
            <TextInput name="name" type="text" placeholder="Name" />
            <TextInput name="phone" type="text" placeholder="Phone" />
            <TextInput name="address" type="text" placeholder="Address" />
            <TextInput name="email" type="email" placeholder="Email" />
            <TextInput name="password" type="password" placeholder="Password" />
            <Button type="submit">Sign up</Button>
          </form>

          <p>
            Already have an account?{" "}
            <Link href="/auth/login" className="underline">
              Log in here
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

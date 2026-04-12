"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, Plus } from "lucide-react";
import Button from "@/ui/base/Button";
import TextInput from "@/ui/base/TextInput";
import { createOrgAndCluster, onboardingInviteUsers } from "./actions";

export default function OnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteList, setInviteList] = useState<string[]>([]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const result = await createOrgAndCluster(formData);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setStep(2);
    }
  };

  const addInviteEmail = () => {
    const trimmed = inviteEmail.trim().toLowerCase();
    if (!trimmed || inviteList.includes(trimmed)) return;
    setInviteList([...inviteList, trimmed]);
    setInviteEmail("");
  };

  const removeInvite = (addr: string) => {
    setInviteList(inviteList.filter((e) => e !== addr));
  };

  const finish = async (withInvites: boolean) => {
    setError(null);
    setLoading(true);
    if (withInvites && inviteList.length > 0) {
      const result = await onboardingInviteUsers(inviteList);
      if (result?.error) {
        setLoading(false);
        setError(result.error);
        return;
      }
    }
    router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
  };

  return (
    <>
      <div className="default-height flex items-center justify-center py-12">
        {step === 1 && (
          <div className="bg-[#f2f2f2] border border-[#e8e8e8] flex flex-col gap-4 p-6 w-[420px]">
            <p className="text-sm text-[#999]">Step 1 of 2</p>
            <h2>Set up your workspace.</h2>

            <form className="flex flex-col gap-4 w-full" onSubmit={handleSetup}>
              <TextInput
                name="org_name"
                type="text"
                placeholder="Organization name"
              />
              <TextInput
                name="cluster_name"
                type="text"
                placeholder="First cluster name"
              />
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Continue"}
              </Button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="bg-[#f2f2f2] border border-[#e8e8e8] flex flex-col gap-4 p-6 w-[420px]">
            <p className="text-sm text-[#999]">Step 2 of 2</p>
            <h2>Invite your team.</h2>

            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="bg-white border border-black flex h-8 items-center px-3 rounded w-full">
                    <input
                      type="email"
                      placeholder="Team member email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addInviteEmail();
                        }
                      }}
                      className="text-black w-full outline-none bg-transparent"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addInviteEmail}
                  className="bg-[#242424] flex h-8 w-8 items-center justify-center rounded cursor-pointer shrink-0"
                >
                  <Plus size={14} className="text-[#d3d3d3]" />
                </button>
              </div>

              {inviteList.length > 0 && (
                <div className="flex flex-col gap-1">
                  {inviteList.map((addr) => (
                    <div
                      key={addr}
                      className="flex items-center justify-between bg-white border border-[#e8e8e8] px-3 h-8"
                    >
                      <span className="text-sm text-[#242424]">{addr}</span>
                      <button type="button" onClick={() => removeInvite(addr)}>
                        <X size={12} className="text-[#999]" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Button
                type="button"
                onClick={() => finish(true)}
                disabled={loading}
              >
                {loading
                  ? "Sending..."
                  : inviteList.length > 0
                  ? "Send invites"
                  : "Continue"}
              </Button>
              <button
                type="button"
                onClick={() => finish(false)}
                className="text-sm text-[#999] text-center hover:text-[#242424] transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}
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
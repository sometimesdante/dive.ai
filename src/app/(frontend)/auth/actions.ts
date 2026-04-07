"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

export async function login(formData: FormData) {
  const supabase = createClient(await cookies());

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
const supabase = createClient(await cookies());

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    options: {
      data: {
        name: formData.get("name") as string,
        phone: formData.get("phone") as any,
        address: formData.get("address") as string,
      },
    },
  };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function acceptInvite(token: string) {
  const supabase = createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const service = createServiceClient()

  const { data: invite, error: fetchError } = await service
    .from('org_invites')
    .select('id, org_id, accepted_at')
    .eq('token', token)
    .single()

  if (fetchError || !invite) return { error: 'Invalid or expired invite' }
  if (invite.accepted_at) return { error: 'This invite has already been used' }

  const { error: profileError } = await service
    .from('profiles')
    .update({ org_id: invite.org_id })
    .eq('id', user.id)

  if (profileError) return { error: profileError.message }

  await service
    .from('org_invites')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invite.id)

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function loginAndAcceptInvite(formData: FormData) {
  const supabase = createClient(await cookies())
  const token = formData.get('token') as string

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) return { error: error.message }

  return acceptInvite(token)
}

export async function signupAndAcceptInvite(formData: FormData) {
  const supabase = createClient(await cookies())
  const token = formData.get('token') as string

  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        name: formData.get('name') as string,
      },
    },
  })
  if (error) return { error: error.message }

  return acceptInvite(token)
}

export async function logout() {
  const supabase = createClient(await cookies());

  const { error } = await supabase.auth.signOut();
  if (error) {
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/");
}

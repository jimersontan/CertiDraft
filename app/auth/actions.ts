"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createClient,
  hasSupabaseServerEnv,
  SUPABASE_CONFIG_ERROR,
} from "@/lib/supabase/server";
import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const fullName = formData.get("fullName") as string;

  // Validation
  if (!email || !password || !confirmPassword || !fullName) {
    return { error: "All fields are required." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  if (!hasSupabaseServerEnv()) {
    return { error: SUPABASE_CONFIG_ERROR };
  }

  const supabase = await createClient();

  // Sign up with Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Insert user profile into public.users table using Admin Client
  if (data.user) {
    try {
      const admin = hasSupabaseAdminEnv() ? createAdminClient() : supabase;
      const { error: profileError } = await admin.from("users").insert({
        id: data.user.id,
        email: data.user.email,
        full_name: fullName,
        plan: "free",
      });

      if (profileError) {
        console.error("Profile insert error:", profileError.message);
      }
    } catch (adminErr) {
      console.error("Failed to initialize admin client for profile creation:", adminErr);
    }
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const isAdminLogin = formData.get("isAdminLogin") === "true";

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (!hasSupabaseServerEnv()) {
    return { error: SUPABASE_CONFIG_ERROR };
  }

  const supabase = await createClient();

  // Special "Built-in Admin" auto-creation handling
  if (email === "admin@certidraft.com" && password === "admin12345") {
    let authRes = await supabase.auth.signInWithPassword({ email, password });
    
    // If login fails (invalid credentials, unconfirmed email, etc.), force the built-in admin state
    if (authRes.error) {
      if (hasSupabaseAdminEnv()) {
        const adminClient = createAdminClient();
        
        // 1. Check if the user profile already exists
        const { data: existingProfile } = await adminClient
          .from("users")
          .select("id")
          .eq("email", email)
          .maybeSingle();
          
        if (existingProfile) {
          // User exists, so force update their auth account to use admin12345 and confirm email
          await adminClient.auth.admin.updateUserById(existingProfile.id, {
            password: password,
            email_confirm: true
          });
          
          // Also make sure their role is set to admin if it's not already
          await adminClient.from("users").update({ role: "admin" }).eq("id", existingProfile.id);
          
        } else {
          // User doesn't exist at all, create from scratch
          const createRes = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: "System Admin" }
          });
          
          if (!createRes.error && createRes.data.user) {
            try {
              await adminClient.from("users").insert({
                id: createRes.data.user.id,
                email,
                full_name: "System Admin",
                role: "admin",
                plan: "enterprise"
              });
            } catch (e) {
              console.error("Failed to insert admin profile:", e);
            }
          } else {
            return { error: "Admin auto-creation failed: " + createRes.error?.message };
          }
        }
        
        // Now that the account is guaranteed to exist and have the right password/confirmation, sign in again
        authRes = await supabase.auth.signInWithPassword({ email, password });
        
      } else {
         return { error: "Admin environment not configured for auto-creation." };
      }
    }
    
    if (authRes.error) return { error: authRes.error.message };
    
    revalidatePath("/", "layout");
    redirect(isAdminLogin ? "/admin" : "/dashboard");
  }

  // Regular login
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Separate portal checks
  if (isAdminLogin) {
    // We check if they actually are an admin to use the admin portal
    const { data: user } = await supabase.auth.getUser();
    if (user?.user) {
      const { data: profile } = await supabase.from("users").select("role").eq("id", user.user.id).single();
      if (profile?.role !== "admin" && user.user.email !== "admin@certidraft.com") {
        await supabase.auth.signOut();
        return { error: "Unauthorized. This portal is for administrators only." };
      }
    }
    revalidatePath("/", "layout");
    redirect("/admin");
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function resetPassword(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Email is required." };
  }

  if (!hasSupabaseServerEnv()) {
    return { error: SUPABASE_CONFIG_ERROR };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL ? "" : ""}${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/auth/update-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Check your email for a password reset link." };
}

export async function signOut() {
  if (!hasSupabaseServerEnv()) {
    redirect("/auth/login");
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth/login");
}

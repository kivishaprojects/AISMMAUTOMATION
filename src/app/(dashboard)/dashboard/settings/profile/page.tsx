import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/features/settings/ProfileForm";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const fullName = (user?.user_metadata as { full_name?: string })?.full_name ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">My Profile</h1>
        <p className="mt-1 text-sm text-neutral-500">Your login details and display info.</p>
      </div>
      <ProfileForm email={user?.email ?? ""} fullName={fullName} />
    </div>
  );
}

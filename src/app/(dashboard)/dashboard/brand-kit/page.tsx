import { getCurrentUserOrgs } from "@/features/org/queries";
import { getBrandKits } from "@/features/brand-kit/queries";
import { BrandKitManager } from "@/features/brand-kit/BrandKitManager";

export default async function BrandKitPage() {
  const orgs = await getCurrentUserOrgs();
  const org = orgs[0];

  if (!org) {
    return (
      <p className="text-sm text-neutral-500">
        You&apos;re not part of an organization yet.
      </p>
    );
  }

  const brandKits = await getBrandKits(org.id);

  return <BrandKitManager organizationId={org.id} brandKits={brandKits} />;
}

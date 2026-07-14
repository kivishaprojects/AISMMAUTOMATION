import { getCurrentUserOrgs } from "@/features/org/queries";
import { getBrandKits } from "@/features/brand-kit/queries";
import { getGeneratedImages } from "@/features/creative-studio/queries";
import { StudioWizard } from "@/features/creative-studio/StudioWizard";
import { AssetGallery } from "@/features/creative-studio/AssetGallery";

export default async function CreativeStudioPage() {
  const orgs = await getCurrentUserOrgs();
  const org = orgs[0];

  if (!org) {
    return (
      <p className="text-sm text-neutral-500">
        You&apos;re not part of an organization yet.
      </p>
    );
  }

  const [brandKits, images] = await Promise.all([
    getBrandKits(org.id),
    getGeneratedImages(org.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          AI Creative Studio
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Create → approve → caption → publish or schedule, all in one flow.
        </p>
      </div>

      <StudioWizard organizationId={org.id} brandKits={brandKits} />

      <div>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">
          Past generations
        </h2>
        <AssetGallery assets={images} />
      </div>
    </div>
  );
}

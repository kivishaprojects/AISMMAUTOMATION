import { ComingSoon } from "@/components/layout/ComingSoon";

export default function SubscriptionPage() {
  return (
    <ComingSoon
      title="Subscription"
      description="Needs Stripe/Razorpay wired up (checkout, plan tiers, usage limits). The organizations.plan column is already in the schema, ready for this."
    />
  );
}

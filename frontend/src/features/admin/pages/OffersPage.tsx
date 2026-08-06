import { PageHeader } from "@/components/ui";
import { operationsApi } from "@/api/operations.api";
import { useQuery } from "@tanstack/react-query";

export default function OffersPage() {
  const { data } = useQuery({
    queryKey: ["admin", "offers"],
    queryFn: async () => (await operationsApi.getOffers()).data.data,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Offers" subtitle="Active and expired promotional offers" />
      <div className="grid gap-4 md:grid-cols-3">
        {(data ?? []).map((offer: { id: string; title?: string; description?: string; code?: string }) => (
          <div key={offer.id} className="rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-300">Limited Time</p>
            <h3 className="mt-3 text-xl font-bold">{offer.title ?? "Special Offer"}</h3>
            <p className="mt-2 text-sm text-emerald-100">{offer.description ?? "Promotional discount for guests."}</p>
            <p className="mt-4 rounded-xl bg-white/20 px-4 py-2 font-mono text-sm">{offer.code ?? "SAFNAM20"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}


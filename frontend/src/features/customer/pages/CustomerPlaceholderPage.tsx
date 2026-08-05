import { useEffect } from "react";
import { CustomerLayout } from "@/layouts/CustomerLayout";

export default function CustomerPlaceholderPage({ title }: { title: string }) {
  useEffect(() => {
    document.title = `SAFNAM - ${title}`;
  }, [title]);

  return (
    <CustomerLayout>
      <div className="mx-auto max-w-3xl px-4 py-20">
        <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
        <p className="mt-3 text-gray-500 dark:text-gray-400">This section is being prepared for the customer experience flow.</p>
      </div>
    </CustomerLayout>
  );
}

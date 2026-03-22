import { Suspense } from "react";
import { ModelDetailPage } from "@/components/admin/model-detail-page";

export default function AdminModelPage() {
  return (
    <Suspense>
      <ModelDetailPage />
    </Suspense>
  );
}

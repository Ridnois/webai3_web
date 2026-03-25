import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { PageContainer } from "@/components/layout/page-container";

export default function AdminPage() {
  return (
    <PageContainer as="main">
      <AdminDashboard />
    </PageContainer>
  );
}

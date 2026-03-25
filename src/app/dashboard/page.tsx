import { UserDashboard } from "@/components/dashboard/user-dashboard";
import { PageContainer } from "@/components/layout/page-container";

export default function DashboardPage() {
  return (
    <PageContainer as="main">
      <UserDashboard />
    </PageContainer>
  );
}

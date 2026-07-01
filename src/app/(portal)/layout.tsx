import { AppShell } from "@/components/AppShell";
import { PortalShell } from "@/components/messenger/PortalShell";
import { NotificationToast } from "@/components/NotificationToast";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalShell>
      <AppShell>{children}</AppShell>
      <NotificationToast />
    </PortalShell>
  );
}

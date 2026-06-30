import { AppShell } from "@/components/AppShell";
import { PortalShell } from "@/components/messenger/PortalShell";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalShell>
      <AppShell>{children}</AppShell>
    </PortalShell>
  );
}

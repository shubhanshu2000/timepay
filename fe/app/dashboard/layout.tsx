import { SidebarProvider } from "@/components/ui/sidebar";
import { Header } from "@/components/Header";
import { AppSidebar } from "@/components/app-sidebar";
import { NotificationProvider } from "@/contexts/NotificationContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <NotificationProvider>
        <AppSidebar />
        <main className="w-full">
          <Header />
          <div className="px-6">{children}</div>
        </main>
      </NotificationProvider>
    </SidebarProvider>
  );
}

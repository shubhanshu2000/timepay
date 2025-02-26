"use client";

import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarContext,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Bell, CreditCard, LayoutDashboard, Users } from "lucide-react";
import Link from "next/link";

const sidebarLinks = [
  // {
  //   title: "Dashboard",
  //   href: "/dashboard",
  //   icon: LayoutDashboard,
  // },
  {
    title: "Customers",
    href: "/dashboard/customers",
    icon: Users,
  },
  // {
  //   title: "Payments",
  //   href: "/dashboard/payments",
  //   icon: CreditCard,
  // },
  {
    title: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const sidebarContextData = React.useContext(SidebarContext);
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarTrigger
        className={`${
          sidebarContextData?.open
            ? "absolute right-4 top-[10px] z-10"
            : "mx-auto mt-2"
        }`}
      />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="border">TimePay</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarLinks.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

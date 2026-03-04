import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Users, BookOpen, GraduationCap, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/admin/users", label: "Usuários", icon: Users },
  { to: "/admin/courses", label: "Cursos", icon: BookOpen },
];

const AdminLayout = () => {
  const { logout, email } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ backgroundColor: "hsl(var(--sidebar-background))" }}>
      <div className="p-5 flex items-center gap-3 border-b" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <GraduationCap className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-sm" style={{ color: "hsl(var(--sidebar-accent-foreground))" }}>Plataforma Admin</span>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-fast",
                isActive
                  ? "bg-primary/15 text-primary font-medium"
                  : "hover:bg-[hsl(var(--sidebar-accent))]"
              )
            }
            style={({ isActive }) => ({
              color: isActive ? "hsl(var(--sidebar-primary))" : "hsl(var(--sidebar-foreground))",
            })}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
        <div className="px-3 py-1.5 mb-2 text-xs truncate" style={{ color: "hsl(var(--sidebar-foreground))" }}>{email}</div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm w-full hover:bg-[hsl(var(--sidebar-accent))] transition-fast"
          style={{ color: "hsl(var(--sidebar-foreground))" }}
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-60 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-foreground/20" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-60 h-full z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 md:ml-60 min-h-screen">
        <header className="sticky top-0 z-20 bg-card border-b border-border h-14 flex items-center px-4 md:px-6">
          <button className="md:hidden mr-3 text-foreground" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
        </header>
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;

import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { MessageSquare, Layout as LayoutIcon, FileText, Settings, Menu, LogOut, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getUser, logout, isAuthenticated } from '@/lib/api';
import AuthModal from './AuthModal';
import ChatInterface from './ChatInterface';

const navItems = [
    { icon: FileText, label: 'Visão Geral', to: '/pages/1 - visão geral' },
    { icon: FileText, label: 'Origem do Programa', to: '/pages/2 - origem do programa' },
    { icon: FileText, label: 'Participantes', to: '/pages/3 - participantes' },
    { icon: FileText, label: 'Serviços', to: '/pages/4 - serviços' },
    { icon: FileText, label: 'Conteúdo', to: '/pages/5 - conteúdo' },
    { icon: FileText, label: 'CloudPilot', to: '/pages/6 - cloudpilot' },
    { icon: FileText, label: 'Resultados', to: '/pages/7 - resultados' },
    { icon: FileText, label: 'Reference', to: '/pages/reference' },
];

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [chatOpen, setChatOpen] = useState(true);
    const [user, setUser] = useState(() => getUser());
    const [showAuth, setShowAuth] = useState(() => !isAuthenticated());

    const handleAuthSuccess = (userData) => {
        setUser(userData);
        setShowAuth(false);
    };

    const handleLogout = () => {
        logout();
    };

    if (showAuth) {
        return <AuthModal onSuccess={handleAuthSuccess} />;
    }

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            {/* Left Sidebar - Navigation */}
            <aside
                className={cn(
                    "h-full bg-card/50 backdrop-blur-xl border-r border-border flex flex-col transition-all duration-300 ease-in-out flex-shrink-0",
                    sidebarOpen ? "w-64" : "w-16"
                )}
            >
                {/* Header */}
                <div className="flex items-center h-16 px-4 border-b border-border">
                    {/* <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                        <Menu className="w-5 h-5" />
                    </button> */}
                    {sidebarOpen && (
                        <span className="ml-3 font-semibold text-lg bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            cloudpilot
                        </span>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )
                        }
                    >
                        <LayoutIcon className="w-5 h-5 flex-shrink-0" />
                        {sidebarOpen && <span className="font-medium">Dashboard</span>}
                    </NavLink>

                    <div className={cn("py-2", sidebarOpen && "px-3")}>
                        {sidebarOpen && (
                            <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
                                Modules
                            </span>
                        )}
                    </div>

                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )
                            }
                        >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            {sidebarOpen && <span>{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* User Section */}
                {user && (
                    <div className="p-4 border-t border-border">
                        <div className={cn("flex items-center gap-3", !sidebarOpen && "justify-center")}>
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                                {user.email[0].toUpperCase()}
                            </div>
                            {sidebarOpen && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{user.email}</p>
                                </div>
                            )}
                            <button
                                onClick={handleLogout}
                                className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                                title="Logout"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </aside>

            {/* Main Content - Center */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto p-6 md:p-8">
                    <Outlet />
                </div>
            </main>

            {/* Right Sidebar - Chat */}
            <aside
                className={cn(
                    "h-full bg-card/30 backdrop-blur-xl border-l border-border flex flex-col transition-all duration-300 ease-in-out flex-shrink-0",
                    chatOpen ? "w-96" : "w-12"
                )}
            >
                {/* Chat Header */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-border">
                    <button
                        onClick={() => setChatOpen(!chatOpen)}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                        title={chatOpen ? "Close chat" : "Open chat"}
                    >
                        <MessageSquare className="w-5 h-5" />
                    </button>
                    {chatOpen && (
                        <span className="font-medium text-muted-foreground">Agent</span>
                    )}
                </div>

                {/* Chat Content */}
                {chatOpen && (
                    <div className="flex-1 overflow-hidden">
                        <ChatInterface />
                    </div>
                )}
            </aside>
        </div>
    );
}

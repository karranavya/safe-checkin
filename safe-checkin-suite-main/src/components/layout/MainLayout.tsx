import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const MainLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Detect desktop screen
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener("resize", handleResize);
    handleResize(); // initial check
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isDesktop) {
      setSidebarOpen(true); // keep open on large screens
    } else {
      setSidebarOpen(false); // close on mobile
    }
  }, [isDesktop]);

  return (
    <div className="min-h-screen w-full relative">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onNavigate={() => !isDesktop && setSidebarOpen(false)}
      />

      {/* Backdrop on mobile when sidebar is open */}
      {!isDesktop && isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content shifted only on desktop if sidebar is open */}
      <div className={isSidebarOpen && isDesktop ? "ml-64" : ""}>
        <Header onMenuClick={() => setSidebarOpen((prev) => !prev)} />
        <main className="p-4 lg:p-6 bg-background min-h-[calc(100vh-56px)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

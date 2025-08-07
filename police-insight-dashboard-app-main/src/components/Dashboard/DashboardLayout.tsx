import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { AutoRefresh } from '@/components/ui/auto-refresh';
import { Sidebar } from './Sidebar';
import { LogOut, Menu, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState({
    district: '',
    zone: '',
    division: '',
    area: '',
    saveForFuture: false,
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check authentication
    const auth = localStorage.getItem('police-dashboard-auth');
    if (!auth) {
      navigate('/');
      return;
    }

    // Load saved filters
    const savedFilters = localStorage.getItem('police-dashboard-filters');
    if (savedFilters) {
      setFilters(JSON.parse(savedFilters));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('police-dashboard-auth');
    localStorage.removeItem('police-dashboard-remember');
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
    navigate('/');
  };

  const handleFilterSubmit = () => {
    if (filters.saveForFuture) {
      localStorage.setItem('police-dashboard-filters', JSON.stringify(filters));
    }
    toast({
      title: "Filters Applied",
      description: "Dashboard updated with selected filters.",
    });
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AutoRefresh />
      
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
      
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card shadow-card border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden rounded-full"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              
              <img
                src="/lovable-uploads/9d9969a7-cbda-48a5-a664-db7cd40ca9fa.png"
                alt="Safe CheckIn"
                className="h-8 w-auto"
              />
              
              <h1 className="text-xl font-bold text-primary hidden sm:block">
                Police Dashboard
              </h1>
            </div>

            <div className="flex items-center space-x-2">
              <ThemeToggle />
              
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                className="rounded-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 p-4 bg-muted/50 rounded-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Select value={filters.district} onValueChange={(value) => setFilters(prev => ({ ...prev, district: value }))}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select District" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mumbai">Mumbai</SelectItem>
                    <SelectItem value="pune">Pune</SelectItem>
                    <SelectItem value="nagpur">Nagpur</SelectItem>
                    <SelectItem value="nashik">Nashik</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zone">Zone</Label>
                <Select value={filters.zone} onValueChange={(value) => setFilters(prev => ({ ...prev, zone: value }))}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select Zone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="north">North Zone</SelectItem>
                    <SelectItem value="south">South Zone</SelectItem>
                    <SelectItem value="east">East Zone</SelectItem>
                    <SelectItem value="west">West Zone</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="division">Division</Label>
                <Select value={filters.division} onValueChange={(value) => setFilters(prev => ({ ...prev, division: value }))}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select Division" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="div1">Division 1</SelectItem>
                    <SelectItem value="div2">Division 2</SelectItem>
                    <SelectItem value="div3">Division 3</SelectItem>
                    <SelectItem value="div4">Division 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="area">Area</Label>
                <Select value={filters.area} onValueChange={(value) => setFilters(prev => ({ ...prev, area: value }))}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select Area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="area1">Area 1</SelectItem>
                    <SelectItem value="area2">Area 2</SelectItem>
                    <SelectItem value="area3">Area 3</SelectItem>
                    <SelectItem value="area4">Area 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="saveFilters"
                  checked={filters.saveForFuture}
                  onCheckedChange={(checked) => setFilters(prev => ({ ...prev, saveForFuture: checked as boolean }))}
                />
                <Label htmlFor="saveFilters" className="text-sm">
                  Save filters for future use
                </Label>
              </div>

              <Button
                onClick={handleFilterSubmit}
                className="bg-gradient-primary hover:opacity-90 rounded-xl"
              >
                Submit
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
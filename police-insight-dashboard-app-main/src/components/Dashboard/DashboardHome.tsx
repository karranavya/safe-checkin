import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Building2, 
  UserCheck, 
  UserX, 
  MapPin,
  Activity
} from 'lucide-react';

// Mock data - in real app this would come from API
const mockData = {
  checkins: {
    today: 285,
    visitors: 178,
  },
  accommodations: {
    active: 24,
    types: {
      hotel: 3,
      lodge: 3,
      guestHouse: 3,
      dormitory: 3,
      pg: 3,
      serviceApartment: 3,
      hostel: 3,
      rentalHouse: 3,
    },
    details: [
      // Hotels
      { id: 1, name: 'Grand Palace Hotel', type: 'hotel', checkins: 15, checkouts: 12 },
      { id: 2, name: 'Budget Inn', type: 'hotel', checkins: 8, checkouts: 6 },
      { id: 3, name: 'Business Center Hotel', type: 'hotel', checkins: 12, checkouts: 10 },
      // Lodges
      { id: 4, name: 'Mountain View Lodge', type: 'lodge', checkins: 6, checkouts: 4 },
      { id: 5, name: 'City Central Lodge', type: 'lodge', checkins: 9, checkouts: 7 },
      { id: 6, name: 'Highway Rest Lodge', type: 'lodge', checkins: 5, checkouts: 3 },
      // Guest Houses
      { id: 7, name: 'Family Guest House', type: 'guestHouse', checkins: 7, checkouts: 5 },
      { id: 8, name: 'Backpacker Haven', type: 'guestHouse', checkins: 4, checkouts: 2 },
      { id: 9, name: 'Executive Guest House', type: 'guestHouse', checkins: 6, checkouts: 4 },
      // Dormitories
      { id: 10, name: 'Student Dormitory', type: 'dormitory', checkins: 25, checkouts: 20 },
      { id: 11, name: 'Worker Housing', type: 'dormitory', checkins: 18, checkouts: 15 },
      { id: 12, name: 'Mixed Dormitory', type: 'dormitory', checkins: 12, checkouts: 8 },
      // PG
      { id: 13, name: 'Boys PG Accommodation', type: 'pg', checkins: 8, checkouts: 6 },
      { id: 14, name: 'Girls PG Residence', type: 'pg', checkins: 10, checkouts: 7 },
      { id: 15, name: 'Co-ed PG Living', type: 'pg', checkins: 14, checkouts: 11 },
      // Service Apartments
      { id: 16, name: 'Short Stay Apartments', type: 'serviceApartment', checkins: 6, checkouts: 4 },
      { id: 17, name: 'Corporate Suites', type: 'serviceApartment', checkins: 8, checkouts: 6 },
      { id: 18, name: 'Family Service Apartments', type: 'serviceApartment', checkins: 5, checkouts: 3 },
      // Hostels
      { id: 19, name: 'Youth Hostel', type: 'hostel', checkins: 12, checkouts: 9 },
      { id: 20, name: 'Budget Backpackers', type: 'hostel', checkins: 8, checkouts: 5 },
      { id: 21, name: 'Premium Hostel', type: 'hostel', checkins: 10, checkouts: 8 },
      // Rental Houses
      { id: 22, name: 'Luxury Villa Rentals', type: 'rentalHouse', checkins: 4, checkouts: 2 },
      { id: 23, name: 'Downtown Apartments', type: 'rentalHouse', checkins: 6, checkouts: 4 },
      { id: 24, name: 'Cottage Rentals', type: 'rentalHouse', checkins: 3, checkouts: 1 },
    ],
  },
  hoppers: 12,
  suspects: 18,
  recentActivity: [
    { id: 1, type: 'checkin', location: 'Grand Palace Hotel', time: '10:30 AM', count: 5, accommodationType: 'hotel' },
    { id: 2, type: 'checkout', location: 'Mountain View Lodge', time: '09:15 AM', count: 3, accommodationType: 'lodge' },
    { id: 3, type: 'checkin', location: 'Student Dormitory', time: '08:45 AM', count: 8, accommodationType: 'dormitory' },
    { id: 4, type: 'hopper', location: 'Station Area', time: '08:30 AM', count: 2 },
    { id: 5, type: 'suspect', location: 'Market Square', time: '07:45 AM', count: 1 },
    { id: 6, type: 'checkin', location: 'Youth Hostel', time: '07:20 AM', count: 4, accommodationType: 'hostel' },
  ],
};

const accommodationTypeColors = {
  hotel: 'hotel',
  lodge: 'lodge', 
  guestHouse: 'guest-house',
  dormitory: 'dormitory',
  pg: 'pg',
  serviceApartment: 'service-apartment',
  hostel: 'hostel',
  rentalHouse: 'rental-house',
};

const accommodationTypeLabels = {
  hotel: 'Hotels',
  lodge: 'Lodges',
  guestHouse: 'Guest Houses',
  dormitory: 'Dormitories', 
  pg: 'PG',
  serviceApartment: 'Service Apartments',
  hostel: 'Hostels',
  rentalHouse: 'Rental Houses',
};

export const DashboardHome = () => {
  const [data, setData] = useState(mockData);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setMapLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'checkin':
        return <UserCheck className="h-4 w-4 text-success" />;
      case 'checkout':
        return <UserX className="h-4 w-4 text-warning" />;
      case 'hopper':
        return <Activity className="h-4 w-4 text-primary" />;
      case 'suspect':
        return <Users className="h-4 w-4 text-destructive" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">Dashboard Overview</h1>
        <Badge variant="outline" className="text-sm">
          Last updated: {new Date().toLocaleTimeString()}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* CheckIn Section */}
        <Card className="bg-gradient-card shadow-card rounded-2xl border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's CheckIns
            </CardTitle>
            <UserCheck className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{data.checkins.today}</div>
            <p className="text-xs text-muted-foreground">
              {data.checkins.visitors} unique visitors
            </p>
          </CardContent>
        </Card>

        {/* Active Accommodations */}
        <Card className="bg-gradient-card shadow-card rounded-2xl border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Accommodations
            </CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{data.accommodations.active}</div>
            <div className="flex flex-wrap gap-1 mt-2">
              <Badge style={{ backgroundColor: `hsl(var(--hotel))`, color: 'white' }} className="text-xs">
                Hotels: {data.accommodations.types.hotel}
              </Badge>
              <Badge style={{ backgroundColor: `hsl(var(--lodge))`, color: 'white' }} className="text-xs">
                Lodges: {data.accommodations.types.lodge}
              </Badge>
              <Badge style={{ backgroundColor: `hsl(var(--guest-house))`, color: 'white' }} className="text-xs">
                Guest Houses: {data.accommodations.types.guestHouse}
              </Badge>
              <Badge style={{ backgroundColor: `hsl(var(--dormitory))`, color: 'white' }} className="text-xs">
                Dormitories: {data.accommodations.types.dormitory}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Hoppers */}
        <Card className="bg-gradient-card shadow-card rounded-2xl border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Hoppers
            </CardTitle>
            <Activity className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{data.hoppers}</div>
            <p className="text-xs text-muted-foreground">
              In current area
            </p>
          </CardContent>
        </Card>

        {/* Suspects */}
        <Card className="bg-gradient-card shadow-card rounded-2xl border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Suspects
            </CardTitle>
            <Users className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{data.suspects}</div>
            <p className="text-xs text-muted-foreground">
              In current area
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Map and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <Card className="lg:col-span-2 bg-gradient-card shadow-card rounded-2xl border-0">
          <CardHeader>
            <CardTitle className="text-primary">Area Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
              {mapLoaded ? (
                <div className="text-center space-y-2">
                  <MapPin className="h-12 w-12 text-primary mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    Interactive map will be integrated here
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Showing accommodations with different colored pins
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Loading map...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-gradient-card shadow-card rounded-2xl border-0">
          <CardHeader>
            <CardTitle className="text-primary">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {activity.location}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time} • {activity.count} {activity.type}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accommodation Types Breakdown */}
      <Card className="bg-gradient-card shadow-card rounded-2xl border-0">
        <CardHeader>
          <CardTitle className="text-primary">Accommodation Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(data.accommodations.types).map(([type, count]) => {
              const colorClass = accommodationTypeColors[type as keyof typeof accommodationTypeColors];
              const label = accommodationTypeLabels[type as keyof typeof accommodationTypeLabels];
              return (
                <div key={type} className="text-center p-4 bg-muted/50 rounded-xl border-2" style={{ borderColor: `hsl(var(--${colorClass}))` }}>
                  <div className="text-2xl font-bold" style={{ color: `hsl(var(--${colorClass}))` }}>{count}</div>
                  <div className="text-sm text-muted-foreground">
                    {label}
                  </div>
                  <div className="w-full h-2 rounded-full mt-2" style={{ backgroundColor: `hsl(var(--${colorClass}) / 0.3)` }}>
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ 
                        backgroundColor: `hsl(var(--${colorClass}))`,
                        width: `${(count / Math.max(...Object.values(data.accommodations.types))) * 100}%`
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
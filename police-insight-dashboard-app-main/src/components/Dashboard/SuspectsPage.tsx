import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Trash2, 
  User, 
  Phone, 
  CreditCard, 
  Car,
  Calendar,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Mock suspects data
const mockSuspects = [
  {
    id: 1,
    name: 'John Doe',
    aadhar: '1234-5678-9012',
    phone: '+91-9876543210',
    vehicle: 'MH-01-AB-1234',
    photo: '/placeholder-avatar.jpg',
    dateAdded: '2024-01-15',
  },
  {
    id: 2,
    name: 'Jane Smith',
    aadhar: '2345-6789-0123',
    phone: '+91-8765432109',
    vehicle: 'MH-02-CD-5678',
    photo: '/placeholder-avatar.jpg',
    dateAdded: '2024-01-20',
  },
  {
    id: 3,
    name: 'Robert Johnson',
    aadhar: '3456-7890-1234',
    phone: '+91-7654321098',
    vehicle: 'MH-03-EF-9012',
    photo: '/placeholder-avatar.jpg',
    dateAdded: '2024-01-25',
  },
];

type SortType = 'name' | 'date';
type SortOrder = 'asc' | 'desc';

export const SuspectsPage = () => {
  const [suspects, setSuspects] = useState(mockSuspects);
  const [sortType, setSortType] = useState<SortType>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSuspect, setSelectedSuspect] = useState<any>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New suspect form data
  const [newSuspect, setNewSuspect] = useState({
    name: '',
    aadhar: '',
    phone: '',
    vehicle: '',
    photo: null as File | null,
  });

  const { toast } = useToast();

  const sortedSuspects = [...suspects].sort((a, b) => {
    if (sortType === 'name') {
      const comparison = a.name.localeCompare(b.name);
      return sortOrder === 'asc' ? comparison : -comparison;
    } else {
      const comparison = new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
      return sortOrder === 'asc' ? comparison : -comparison;
    }
  });

  const handleAddSuspect = async () => {
    if (!newSuspect.name || !newSuspect.aadhar || !newSuspect.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      const suspect = {
        id: Date.now(),
        ...newSuspect,
        photo: '/placeholder-avatar.jpg', // In real app, handle file upload
        dateAdded: new Date().toISOString().split('T')[0],
      };
      
      setSuspects(prev => [...prev, suspect]);
      setNewSuspect({ name: '', aadhar: '', phone: '', vehicle: '', photo: null });
      setShowAddModal(false);
      setIsSubmitting(false);
      
      toast({
        title: "Suspect Added",
        description: "New suspect has been added to the database.",
      });
    }, 1000);
  };

  const handleDeleteSuspect = async () => {
    if (!deleteReason.trim()) {
      // Vibrate effect for empty reason
      const textarea = document.getElementById('deleteReason') as HTMLTextAreaElement;
      if (textarea) {
        textarea.classList.add('animate-pulse', 'border-destructive');
        setTimeout(() => {
          textarea.classList.remove('animate-pulse', 'border-destructive');
        }, 1000);
      }
      return;
    }

    setIsSubmitting(true);
    
    // Simulate email sending and deletion
    setTimeout(() => {
      setSuspects(prev => prev.filter(s => s.id !== selectedSuspect.id));
      setShowDeleteModal(false);
      setSelectedSuspect(null);
      setDeleteReason('');
      setIsSubmitting(false);
      
      toast({
        title: "Suspect Deleted",
        description: "Suspect has been removed and deletion report sent to supervisor.",
      });
    }, 1000);
  };

  const formatAadhar = (aadhar: string) => {
    return aadhar.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">Suspects Management</h1>
        <div className="flex items-center space-x-2">
          <Select value={`${sortType}-${sortOrder}`} onValueChange={(value) => {
            const [type, order] = value.split('-') as [SortType, SortOrder];
            setSortType(type);
            setSortOrder(order);
          }}>
            <SelectTrigger className="w-[180px] rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">
                <div className="flex items-center">
                  <SortAsc className="h-4 w-4 mr-2" />
                  Name (A-Z)
                </div>
              </SelectItem>
              <SelectItem value="name-desc">
                <div className="flex items-center">
                  <SortDesc className="h-4 w-4 mr-2" />
                  Name (Z-A)
                </div>
              </SelectItem>
              <SelectItem value="date-desc">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Latest Added
                </div>
              </SelectItem>
              <SelectItem value="date-asc">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Oldest Added
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90 rounded-xl">
                <Plus className="h-4 w-4 mr-2" />
                Add New Suspect
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-primary">Add New Suspect</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={newSuspect.name}
                    onChange={(e) => setNewSuspect(prev => ({ ...prev, name: e.target.value }))}
                    className="rounded-xl"
                    placeholder="Enter suspect name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="aadhar">Aadhar Number *</Label>
                  <Input
                    id="aadhar"
                    value={newSuspect.aadhar}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                      setNewSuspect(prev => ({ ...prev, aadhar: formatAadhar(value) }));
                    }}
                    className="rounded-xl"
                    placeholder="1234-5678-9012"
                    maxLength={14}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={newSuspect.phone}
                    onChange={(e) => setNewSuspect(prev => ({ ...prev, phone: e.target.value }))}
                    className="rounded-xl"
                    placeholder="+91-9876543210"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="vehicle">Vehicle Number</Label>
                  <Input
                    id="vehicle"
                    value={newSuspect.vehicle}
                    onChange={(e) => setNewSuspect(prev => ({ ...prev, vehicle: e.target.value }))}
                    className="rounded-xl"
                    placeholder="MH-01-AB-1234"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="photo">Photograph</Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewSuspect(prev => ({ ...prev, photo: e.target.files?.[0] || null }))}
                    className="rounded-xl"
                  />
                </div>
                
                <Button
                  onClick={handleAddSuspect}
                  disabled={isSubmitting}
                  className="w-full bg-gradient-primary hover:opacity-90 rounded-xl"
                >
                  {isSubmitting ? 'Adding...' : 'Add Suspect'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Suspects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedSuspects.map((suspect) => (
          <Card key={suspect.id} className="bg-gradient-card shadow-card rounded-2xl border-0 hover:shadow-glow transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{suspect.name}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      Added: {new Date(suspect.dateAdded).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  className="rounded-full h-8 w-8"
                  onClick={() => {
                    setSelectedSuspect(suspect);
                    setShowDeleteModal(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{suspect.aadhar}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{suspect.phone}</span>
              </div>
              {suspect.vehicle && (
                <div className="flex items-center space-x-2">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{suspect.vehicle}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Suspect</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You are about to delete <strong>{selectedSuspect?.name}</strong>. 
              Please provide a reason for deletion:
            </p>
            <Textarea
              id="deleteReason"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Enter reason for deletion (required)"
              className="rounded-xl min-h-[100px]"
            />
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteReason('');
                }}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteSuspect}
                disabled={isSubmitting}
                className="flex-1 rounded-xl"
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
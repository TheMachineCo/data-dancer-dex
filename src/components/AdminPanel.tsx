import { useState, useEffect } from "react";
import { Plus, Search, Users, Edit, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { UserEditDialog } from "./UserEditDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "./ThemeToggle";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  birth_date?: string;
  height?: number;
  weight?: number;
  address?: string;
  avatar_url?: string;
  created_at: string;
}

export function AdminPanel() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Hata",
          description: "Kullanıcılar yüklenirken bir hata oluştu",
          variant: "destructive",
        });
        return;
      }

      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const filteredProfiles = profiles.filter(profile =>
    profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditUser = (user: Profile) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsDialogOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      toast({
        title: "Hata",
        description: "Kullanıcı silinirken bir hata oluştu",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Başarılı",
      description: "Kullanıcı başarıyla silindi",
    });

    fetchProfiles();
  };

  const onUserSaved = () => {
    fetchProfiles();
    setIsDialogOpen(false);
  };

  const handleAvatarClick = (avatarUrl?: string) => {
    if (!avatarUrl) return;
    setSelectedAvatar(avatarUrl);
    setIsImageDialogOpen(true);
  };

  const handleImageDialogChange = (open: boolean) => {
    setIsImageDialogOpen(open);
    if (!open) {
      setSelectedAvatar(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-admin-bg flex items-center justify-center">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-admin-bg">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-admin-accent" />
              <h1 className="text-2xl font-bold text-card-foreground">Kullanıcı Yönetimi</h1>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button onClick={handleAddUser} className="bg-admin-accent hover:bg-admin-accent/90 text-admin-accent-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Yeni Kullanıcı
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Kullanıcı ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProfiles.map((profile) => (
            <Card key={profile.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  {profile.avatar_url ? (
                    <button
                      type="button"
                      onClick={() => handleAvatarClick(profile.avatar_url)}
                      className="w-12 h-12 rounded-full bg-admin-accent/10 flex items-center justify-center overflow-hidden focus:outline-none focus:ring-2 focus:ring-admin-accent cursor-zoom-in"
                      aria-label={`${profile.full_name} profil fotoğrafını büyüt`}
                    >
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-admin-accent/10 flex items-center justify-center overflow-hidden">
                      <span className="text-admin-accent font-semibold">
                        {profile.full_name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-card-foreground truncate">
                      {profile.full_name}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {profile.email}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  {profile.phone && (
                    <p className="flex items-center">
                      <span className="font-medium w-16">Tel:</span>
                      {profile.phone}
                    </p>
                  )}
                  {profile.birth_date && (
                    <p className="flex items-center">
                      <span className="font-medium w-16">Yaş:</span>
                      {new Date().getFullYear() - new Date(profile.birth_date).getFullYear()}
                    </p>
                  )}
                  {profile.height && profile.weight && (
                    <p className="flex items-center">
                      <span className="font-medium w-16">B/K:</span>
                      {profile.height}cm / {profile.weight}kg
                    </p>
                  )}
                </div>

                <div className="flex space-x-2 mt-4 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditUser(profile)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Düzenle
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteUser(profile.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredProfiles.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? "Arama kriterine uygun kullanıcı bulunamadı" : "Henüz kullanıcı eklenmemiş"}
            </p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <UserEditDialog
        user={selectedUser}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onUserSaved={onUserSaved}
      />

      <Dialog open={isImageDialogOpen} onOpenChange={handleImageDialogChange}>
        <DialogContent className="max-w-5xl w-[90vw] h-[90vh] p-0 bg-transparent border-none shadow-none flex items-center justify-center">
          {selectedAvatar && (
            <img
              src={selectedAvatar}
              alt="Seçili kullanıcı profil fotoğrafı"
              className="max-h-full max-w-full object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

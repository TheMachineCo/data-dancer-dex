import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Users, Edit, Trash2, UserPlus, UserMinus, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserEditDialog } from "./UserEditDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "./ThemeToggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface Friendship {
  id: string;
  user_a_id: string;
  user_b_id: string;
  started_at: string;
  ended_at: string | null;
}

interface FriendshipLog {
  id: string;
  user_a_id: string;
  user_b_id: string;
  action: string;
  created_at: string;
}

export function AdminPanel() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [friendshipLogs, setFriendshipLogs] = useState<FriendshipLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [friendManagerUser, setFriendManagerUser] = useState<Profile | null>(null);
  const [isFriendDialogOpen, setIsFriendDialogOpen] = useState(false);
  const [friendSearchTerm, setFriendSearchTerm] = useState("");
  const [selectedLogUserId, setSelectedLogUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadData = async (showLoader = false) => {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const [profilesResponse, friendshipsResponse, logsResponse] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('friendships').select('*'),
        supabase.from('friendship_logs').select('*').order('created_at', { ascending: false }),
      ]);

      if (profilesResponse.error) {
        toast({
          title: "Hata",
          description: "Kullanıcılar yüklenirken bir hata oluştu",
          variant: "destructive",
        });
      } else {
        setProfiles(profilesResponse.data || []);
        setSelectedLogUserId((current) => {
          if (profilesResponse.data?.length) {
            if (current && profilesResponse.data.some((profile) => profile.id === current)) {
              return current;
            }

            return profilesResponse.data[0].id;
          }

          return null;
        });
      }

      if (friendshipsResponse.error) {
        toast({
          title: "Hata",
          description: "Arkadaşlıklar yüklenirken bir sorun oluştu",
          variant: "destructive",
        });
      } else {
        setFriendships(friendshipsResponse.data || []);
      }

      if (logsResponse.error) {
        toast({
          title: "Hata",
          description: "Arkadaşlık logları yüklenirken bir sorun oluştu",
          variant: "destructive",
        });
      } else {
        setFriendshipLogs(logsResponse.data || []);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast({
        title: "Hata",
        description: "Veriler yüklenirken beklenmeyen bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData(true);
  }, []);

  const profileMap = useMemo(() => {
    return new Map(profiles.map((profile) => [profile.id, profile] as const));
  }, [profiles]);

  const activeFriendMap = useMemo(() => {
    const map = new Map<string, Profile[]>();

    friendships
      .filter((friendship) => !friendship.ended_at)
      .forEach((friendship) => {
        const firstProfile = profileMap.get(friendship.user_a_id);
        const secondProfile = profileMap.get(friendship.user_b_id);

        if (firstProfile && secondProfile) {
          map.set(friendship.user_a_id, [...(map.get(friendship.user_a_id) || []), secondProfile]);
          map.set(friendship.user_b_id, [...(map.get(friendship.user_b_id) || []), firstProfile]);
        }
      });

    return map;
  }, [friendships, profileMap]);

  const selectedUserLogs = useMemo(() => {
    if (!selectedLogUserId) {
      return [];
    }

    return friendshipLogs
      .filter(
        (log) => log.user_a_id === selectedLogUserId || log.user_b_id === selectedLogUserId,
      )
      .sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }, [friendshipLogs, selectedLogUserId]);

  const filteredProfiles = profiles.filter(profile =>
    profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFriendsForUser = (userId: string) => {
    return activeFriendMap.get(userId) || [];
  };

  const formatDateTime = (value: string) => {
    try {
      return new Date(value).toLocaleString('tr-TR', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
    } catch (error) {
      return value;
    }
  };

  const currentFriendList = friendManagerUser
    ? [...getFriendsForUser(friendManagerUser.id)].sort((a, b) =>
        a.full_name.localeCompare(b.full_name, 'tr'),
      )
    : [];

  const availableFriendOptions = friendManagerUser
    ? profiles
        .filter((profile) => profile.id !== friendManagerUser.id)
        .filter((profile) => !currentFriendList.some((friend) => friend.id === profile.id))
        .filter((profile) => {
          if (!friendSearchTerm) {
            return true;
          }

          const query = friendSearchTerm.toLowerCase();
          return (
            profile.full_name.toLowerCase().includes(query) ||
            profile.email.toLowerCase().includes(query)
          );
        })
        .sort((a, b) => a.full_name.localeCompare(b.full_name, 'tr'))
    : [];

  const handleEditUser = (user: Profile) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsDialogOpen(true);
  };

  const handleManageFriends = (user: Profile) => {
    setFriendManagerUser(user);
    setFriendSearchTerm("");
    setIsFriendDialogOpen(true);
  };

  const handleFriendDialogChange = (open: boolean) => {
    setIsFriendDialogOpen(open);
    if (!open) {
      setFriendManagerUser(null);
      setFriendSearchTerm("");
    }
  };

  const handleAddFriend = async (friendId: string) => {
    if (!friendManagerUser) {
      return;
    }

    if (friendManagerUser.id === friendId) {
      toast({
        title: "Uyarı",
        description: "Bir kullanıcı kendisini arkadaş listesine ekleyemez",
      });
      return;
    }

    const now = new Date().toISOString();

    try {
      const { data: existingFriendship, error: existingError } = await supabase
        .from('friendships')
        .select('*')
        .or(
          `and(user_a_id.eq.${friendManagerUser.id},user_b_id.eq.${friendId}),and(user_a_id.eq.${friendId},user_b_id.eq.${friendManagerUser.id})`,
        )
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (existingFriendship && !existingFriendship.ended_at) {
        toast({
          title: "Bilgi",
          description: "Bu kullanıcı zaten arkadaş listenizde",
        });
        return;
      }

      if (existingFriendship) {
        const { error: updateError } = await supabase
          .from('friendships')
          .update({ started_at: now, ended_at: null })
          .eq('id', existingFriendship.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        const [primaryId, secondaryId] = friendManagerUser.id < friendId
          ? [friendManagerUser.id, friendId]
          : [friendId, friendManagerUser.id];

        const { error: insertError } = await supabase.from('friendships').insert([
          {
            user_a_id: primaryId,
            user_b_id: secondaryId,
            started_at: now,
            ended_at: null,
          },
        ]);

        if (insertError) {
          throw insertError;
        }
      }

      const { error: logError } = await supabase.from('friendship_logs').insert([
        {
          user_a_id: friendManagerUser.id,
          user_b_id: friendId,
          action: 'started',
          created_at: now,
        },
      ]);

      if (logError) {
        throw logError;
      }

      toast({
        title: "Başarılı",
        description: "Arkadaş başarıyla eklendi",
      });

      await loadData();
    } catch (error) {
      console.error('Error adding friend:', error);
      toast({
        title: "Hata",
        description: "Arkadaş eklenirken bir sorun oluştu",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!friendManagerUser) {
      return;
    }

    const now = new Date().toISOString();

    try {
      const { data: existingFriendship, error: existingError } = await supabase
        .from('friendships')
        .select('*')
        .or(
          `and(user_a_id.eq.${friendManagerUser.id},user_b_id.eq.${friendId}),and(user_a_id.eq.${friendId},user_b_id.eq.${friendManagerUser.id})`,
        )
        .is('ended_at', null)
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (!existingFriendship) {
        toast({
          title: "Bilgi",
          description: "Bu kullanıcı zaten arkadaş listenizde değil",
        });
        return;
      }

      const { error: updateError } = await supabase
        .from('friendships')
        .update({ ended_at: now })
        .eq('id', existingFriendship.id);

      if (updateError) {
        throw updateError;
      }

      const { error: logError } = await supabase.from('friendship_logs').insert([
        {
          user_a_id: friendManagerUser.id,
          user_b_id: friendId,
          action: 'ended',
          created_at: now,
        },
      ]);

      if (logError) {
        throw logError;
      }

      toast({
        title: "Başarılı",
        description: "Arkadaş listeden kaldırıldı",
      });

      await loadData();
    } catch (error) {
      console.error('Error removing friend:', error);
      toast({
        title: "Hata",
        description: "Arkadaş kaldırılırken bir sorun oluştu",
        variant: "destructive",
      });
    }
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

    await loadData();
  };

  const onUserSaved = () => {
    loadData();
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
          {filteredProfiles.map((profile) => {
            const friends = getFriendsForUser(profile.id);

            return (
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

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Arkadaşlar
                    </p>
                    {friends.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {friends.map((friend) => (
                          <Badge key={friend.id} variant="secondary" className="text-xs font-medium">
                            {friend.full_name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Henüz arkadaş eklenmemiş
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditUser(profile)}
                      className="flex-1 min-w-[120px]"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Düzenle
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleManageFriends(profile)}
                      className="flex-1 min-w-[140px]"
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Arkadaşları Yönet
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
            );
          })}
          </div>

        {filteredProfiles.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? "Arama kriterine uygun kullanıcı bulunamadı" : "Henüz kullanıcı eklenmemiş"}
            </p>
          </div>
        )}

        <div className="mt-12">
          <Card className="border-border/70">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <History className="h-5 w-5 text-admin-accent" />
                  Arkadaşlık Logları
                </CardTitle>
                <CardDescription>
                  Kullanıcıların arkadaşlık başlangıç ve bitiş tarihlerini buradan takip edebilirsiniz.
                </CardDescription>
              </div>
              <div className="w-full sm:max-w-xs">
                <Select
                  value={selectedLogUserId ?? undefined}
                  onValueChange={(value) => setSelectedLogUserId(value)}
                  disabled={profiles.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kullanıcı seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {profiles.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Log görüntülemek için önce kullanıcı ekleyin.
                </p>
              ) : !selectedLogUserId ? (
                <p className="text-sm text-muted-foreground">
                  Log görüntülemek için bir kullanıcı seçin.
                </p>
              ) : selectedUserLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Bu kullanıcı için henüz arkadaşlık hareketi kaydedilmemiş.
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedUserLogs.map((log) => {
                    const otherUserId =
                      log.user_a_id === selectedLogUserId ? log.user_b_id : log.user_a_id;
                    const otherUser = profileMap.get(otherUserId);
                    const isStart = log.action === 'started';

                    return (
                      <div
                        key={log.id}
                        className="flex flex-col gap-2 rounded-lg border border-border/70 bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-medium text-card-foreground">
                            {otherUser?.full_name || 'Bilinmeyen Kullanıcı'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {isStart ? 'Arkadaşlık başlatıldı' : 'Arkadaşlık sonlandırıldı'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={isStart ? 'secondary' : 'outline'} className="text-xs uppercase tracking-wide">
                            {isStart ? 'Başlangıç' : 'Bitiş'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{formatDateTime(log.created_at)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <UserEditDialog
        user={selectedUser}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onUserSaved={onUserSaved}
      />

      <Dialog open={isFriendDialogOpen} onOpenChange={handleFriendDialogChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {friendManagerUser
                ? `${friendManagerUser.full_name} • Arkadaş Yönetimi`
                : 'Arkadaşları Yönet'}
            </DialogTitle>
            <DialogDescription>
              Arkadaş eklemek veya mevcut arkadaşlıkları sonlandırmak için listeleri kullanın.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-card-foreground">Mevcut Arkadaşlar</h3>
              <p className="text-sm text-muted-foreground">
                Listeden kaldırmak istediğiniz arkadaşları çıkarabilirsiniz.
              </p>
              <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
                {friendManagerUser && currentFriendList.length > 0 ? (
                  currentFriendList.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between rounded-lg border border-border/60 bg-card/70 p-3"
                    >
                      <div>
                        <p className="font-medium text-card-foreground">{friend.full_name}</p>
                        <p className="text-xs text-muted-foreground">{friend.email}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFriend(friend.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <UserMinus className="h-4 w-4 mr-1" />
                        Kaldır
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {friendManagerUser
                      ? 'Bu kullanıcının henüz arkadaş listesi yok.'
                      : 'Arkadaş yönetimi için bir kullanıcı seçin.'}
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-card-foreground">Yeni Arkadaş Ekle</h3>
              <p className="text-sm text-muted-foreground">
                Arama yaparak mevcut kullanıcılar arasından arkadaş ekleyin.
              </p>
              <Input
                className="mt-3"
                placeholder="İsim veya e-posta ile ara..."
                value={friendSearchTerm}
                onChange={(event) => setFriendSearchTerm(event.target.value)}
                disabled={!friendManagerUser}
              />
              <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
                {friendManagerUser && availableFriendOptions.length > 0 ? (
                  availableFriendOptions.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between rounded-lg border border-border/60 bg-card/70 p-3"
                    >
                      <div>
                        <p className="font-medium text-card-foreground">{friend.full_name}</p>
                        <p className="text-xs text-muted-foreground">{friend.email}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddFriend(friend.id)}
                        className="bg-admin-accent hover:bg-admin-accent/90 text-admin-accent-foreground"
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Ekle
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {friendManagerUser
                      ? 'Eklenecek uygun kullanıcı bulunamadı.'
                      : 'Önce bir kullanıcı seçin.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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

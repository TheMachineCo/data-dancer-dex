import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
}

interface UserEditDialogProps {
  user: Profile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserSaved: () => void;
}

export function UserEditDialog({ user, open, onOpenChange, onUserSaved }: UserEditDialogProps) {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    birth_date: "",
    height: "",
    weight: "",
    address: "",
    avatar_url: "",
  });
  const [birthDate, setBirthDate] = useState<Date>();
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
        birth_date: user.birth_date || "",
        height: user.height?.toString() || "",
        weight: user.weight?.toString() || "",
        address: user.address || "",
        avatar_url: user.avatar_url || "",
      });
      if (user.birth_date) {
        setBirthDate(new Date(user.birth_date));
      }
    } else {
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        birth_date: "",
        height: "",
        weight: "",
        address: "",
        avatar_url: "",
      });
      setBirthDate(undefined);
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateSelect = (date: Date | undefined) => {
    setBirthDate(date);
    if (date) {
      setFormData(prev => ({
        ...prev,
        birth_date: format(date, "yyyy-MM-dd")
      }));
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Hata",
        description: "Dosya boyutu 5MB'dan küçük olmalıdır",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        avatar_url: data.publicUrl
      }));

      toast({
        title: "Başarılı",
        description: "Fotoğraf yüklendi",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Hata",
        description: "Fotoğraf yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.full_name || !formData.email) {
      toast({
        title: "Hata",
        description: "Ad ve e-posta alanları zorunludur",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone || null,
        birth_date: formData.birth_date || null,
        height: formData.height ? parseInt(formData.height) : null,
        weight: formData.weight ? parseInt(formData.weight) : null,
        address: formData.address || null,
        avatar_url: formData.avatar_url || null,
      };

      if (user) {
        // Update existing user
        const { error } = await supabase
          .from('profiles')
          .update(dataToSave)
          .eq('id', user.id);

        if (error) throw error;

        toast({
          title: "Başarılı",
          description: "Kullanıcı güncellendi",
        });
      } else {
        // Create new user
        const { error } = await supabase
          .from('profiles')
          .insert([dataToSave]);

        if (error) throw error;

        toast({
          title: "Başarılı",
          description: "Yeni kullanıcı eklendi",
        });
      }

      onUserSaved();
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Hata",
        description: "Kullanıcı kaydedilirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {user ? "Kullanıcı Düzenle" : "Yeni Kullanıcı Ekle"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Avatar Upload */}
          <div className="space-y-2">
            <Label>Profil Fotoğrafı</Label>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-admin-accent/10 flex items-center justify-center overflow-hidden">
                {formData.avatar_url ? (
                  <img 
                    src={formData.avatar_url} 
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Upload className="h-6 w-6 text-admin-accent" />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="avatar-upload"
                  disabled={uploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  disabled={uploading}
                >
                  {uploading ? "Yükleniyor..." : "Fotoğraf Seç"}
                </Button>
                {formData.avatar_url && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, avatar_url: "" }))}
                    className="ml-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name">Ad Soyad *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => handleInputChange("full_name", e.target.value)}
              placeholder="Ad Soyad"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">E-posta *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="ornek@email.com"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="+90 555 123 4567"
            />
          </div>

          {/* Birth Date */}
          <div className="space-y-2">
            <Label>Doğum Tarihi</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !birthDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {birthDate ? format(birthDate, "dd/MM/yyyy") : "Tarih seçin"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={birthDate}
                  onSelect={handleDateSelect}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Height & Weight */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="height">Boy (cm)</Label>
              <Input
                id="height"
                type="number"
                value={formData.height}
                onChange={(e) => handleInputChange("height", e.target.value)}
                placeholder="175"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Kilo (kg)</Label>
              <Input
                id="weight"
                type="number"
                value={formData.weight}
                onChange={(e) => handleInputChange("weight", e.target.value)}
                placeholder="70"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Adres</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Tam adres..."
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              İptal
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-admin-accent hover:bg-admin-accent/90 text-admin-accent-foreground"
            >
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
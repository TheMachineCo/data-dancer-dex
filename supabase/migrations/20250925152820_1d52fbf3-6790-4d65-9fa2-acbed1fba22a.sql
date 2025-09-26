-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  birth_date DATE,
  height INTEGER, -- in cm
  weight INTEGER, -- in kg
  address TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access (since no login required, allow all operations)
CREATE POLICY "Allow all operations on profiles" 
ON public.profiles 
FOR ALL
USING (true)
WITH CHECK (true);

-- Create storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public) VALUES ('profiles', 'profiles', true);

-- Create policies for profile picture uploads
CREATE POLICY "Profile images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'profiles');

CREATE POLICY "Anyone can upload profile images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'profiles');

CREATE POLICY "Anyone can update profile images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'profiles');

CREATE POLICY "Anyone can delete profile images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'profiles');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.profiles (full_name, email, phone, birth_date, height, weight, address) VALUES
('Ahmet Yılmaz', 'ahmet@example.com', '+90 555 123 4567', '1990-05-15', 175, 70, 'İstanbul, Türkiye'),
('Ayşe Demir', 'ayse@example.com', '+90 555 987 6543', '1985-08-22', 160, 55, 'Ankara, Türkiye'),
('Mehmet Kaya', 'mehmet@example.com', '+90 555 456 7890', '1992-12-03', 180, 75, 'İzmir, Türkiye'),
('Fatma Özkan', 'fatma@example.com', '+90 555 321 6547', '1988-03-17', 165, 60, 'Bursa, Türkiye');
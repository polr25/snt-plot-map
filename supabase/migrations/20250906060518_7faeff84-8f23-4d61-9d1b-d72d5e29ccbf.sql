-- Create table for land plots (участки)
CREATE TABLE public.land_plots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plot_number TEXT NOT NULL UNIQUE,
  owner_name TEXT,
  owner_phone TEXT,
  owner_email TEXT,
  area_sqm DECIMAL(10,2),
  status TEXT DEFAULT 'occupied' CHECK (status IN ('occupied', 'vacant', 'for_sale')),
  coordinates JSONB, -- SVG coordinates for the plot shape
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.land_plots ENABLE ROW LEVEL SECURITY;

-- Create policies for land plots (public read access for now)
CREATE POLICY "Anyone can view land plots" 
ON public.land_plots 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage land plots" 
ON public.land_plots 
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Create storage bucket for plot schemes
INSERT INTO storage.buckets (id, name, public) VALUES ('plot-schemes', 'plot-schemes', true);

-- Create policies for plot schemes storage
CREATE POLICY "Anyone can view plot schemes" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'plot-schemes');

CREATE POLICY "Authenticated users can upload plot schemes" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'plot-schemes' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update plot schemes" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'plot-schemes' AND auth.uid() IS NOT NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_land_plots_updated_at
BEFORE UPDATE ON public.land_plots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.land_plots (plot_number, owner_name, owner_phone, area_sqm, status, coordinates, notes) VALUES
('001', 'Иванов И.И.', '+7 123 456-78-90', 600.5, 'occupied', '{"points": "100,100 200,100 200,200 100,200"}', 'Дом построен в 2020 году'),
('002', 'Петров П.П.', '+7 234 567-89-01', 550.0, 'occupied', '{"points": "200,100 300,100 300,200 200,200"}', 'Баня, сад'),
('003', '', '', 600.0, 'vacant', '{"points": "300,100 400,100 400,200 300,200"}', 'Участок свободен'),
('004', 'Сидоров С.С.', '+7 345 678-90-12', 650.0, 'for_sale', '{"points": "100,200 200,200 200,300 100,300"}', 'Продается, цена договорная');
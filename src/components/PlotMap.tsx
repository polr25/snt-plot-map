import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, MapPin, User, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface LandPlot {
  id: string;
  plot_number: string;
  owner_name: string | null;
  owner_phone: string | null;
  owner_email: string | null;
  area_sqm: number | null;
  status: string;
  coordinates: any;
  notes: string | null;
}

export const PlotMap = () => {
  const [plots, setPlots] = useState<LandPlot[]>([]);
  const [selectedPlot, setSelectedPlot] = useState<LandPlot | null>(null);
  const [hoveredPlot, setHoveredPlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlots();
  }, []);

  const fetchPlots = async () => {
    try {
      const { data, error } = await supabase
        .from('land_plots')
        .select('*')
        .order('plot_number');
      
      if (error) throw error;
      setPlots((data as LandPlot[]) || []);
    } catch (error) {
      console.error('Error fetching plots:', error);
      toast.error('Ошибка загрузки данных участков');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied': return 'hsl(142, 76%, 36%)';
      case 'vacant': return 'hsl(48, 96%, 53%)';
      case 'for_sale': return 'hsl(0, 84%, 60%)';
      default: return 'hsl(210, 40%, 80%)';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'occupied': return 'Занят';
      case 'vacant': return 'Свободен';
      case 'for_sale': return 'Продается';
      default: return 'Неизвестно';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Загрузка карты участков...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Карта участков */}
      <div className="lg:col-span-2">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Карта участков СНТ
            </CardTitle>
            <CardDescription>
              Наведите на участок для просмотра информации
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative border rounded-lg overflow-hidden">
              <svg 
                viewBox="0 0 500 400" 
                className="w-full h-auto bg-muted/10"
                style={{ minHeight: '300px' }}
              >
                {/* Сетка */}
                <defs>
                  <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                
                {/* Участки */}
                {plots.map((plot) => {
                  if (!plot.coordinates?.points) return null;
                  
                  const isHovered = hoveredPlot === plot.id;
                  const isSelected = selectedPlot?.id === plot.id;
                  
                  return (
                    <g key={plot.id}>
                      <polygon
                        points={plot.coordinates.points}
                        fill={getStatusColor(plot.status)}
                        fillOpacity={isHovered || isSelected ? 0.8 : 0.6}
                        stroke="hsl(var(--border))"
                        strokeWidth={isHovered || isSelected ? 2 : 1}
                        className="cursor-pointer transition-all duration-200"
                        onMouseEnter={() => setHoveredPlot(plot.id)}
                        onMouseLeave={() => setHoveredPlot(null)}
                        onClick={() => setSelectedPlot(plot)}
                      />
                      <text
                        x={plot.coordinates.points.split(' ')[0].split(',')[0]}
                        y={plot.coordinates.points.split(' ')[0].split(',')[1]}
                        dx="10"
                        dy="15"
                        className="fill-foreground text-xs font-medium pointer-events-none"
                      >
                        №{plot.plot_number}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            
            {/* Легенда */}
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: getStatusColor('occupied') }} />
                <span className="text-sm">Занят</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: getStatusColor('vacant') }} />
                <span className="text-sm">Свободен</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: getStatusColor('for_sale') }} />
                <span className="text-sm">Продается</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Информация об участке */}
      <div className="space-y-4">
        {selectedPlot ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Участок №{selectedPlot.plot_number}</span>
                <Badge variant={selectedPlot.status === 'occupied' ? 'default' : 
                              selectedPlot.status === 'vacant' ? 'secondary' : 'destructive'}>
                  {getStatusLabel(selectedPlot.status)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedPlot.owner_name && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{selectedPlot.owner_name}</span>
                </div>
              )}
              
              {selectedPlot.owner_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedPlot.owner_phone}</span>
                </div>
              )}
              
              {selectedPlot.area_sqm && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedPlot.area_sqm} м²</span>
                </div>
              )}
              
              {selectedPlot.notes && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Заметки:</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">{selectedPlot.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground text-center">
                Выберите участок на карте для просмотра информации
              </p>
            </CardContent>
          </Card>
        )}

        {/* Статистика */}
        <Card>
          <CardHeader>
            <CardTitle>Статистика</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Всего участков:</span>
              <span className="font-medium">{plots.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Занятых:</span>
              <span className="font-medium">{plots.filter(p => p.status === 'occupied').length}</span>
            </div>
            <div className="flex justify-between">
              <span>Свободных:</span>
              <span className="font-medium">{plots.filter(p => p.status === 'vacant').length}</span>
            </div>
            <div className="flex justify-between">
              <span>Продается:</span>
              <span className="font-medium">{plots.filter(p => p.status === 'for_sale').length}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
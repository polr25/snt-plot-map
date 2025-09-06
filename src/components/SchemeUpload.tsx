import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, FileImage } from 'lucide-react';
import { toast } from 'sonner';

interface SchemeUploadProps {
  onSchemeUploaded: (url: string) => void;
  currentScheme?: string | null;
}

export const SchemeUpload: React.FC<SchemeUploadProps> = ({ onSchemeUploaded, currentScheme }) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Пожалуйста, выберите изображение');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Размер файла не должен превышать 10 МБ');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `scheme-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('plot-schemes')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('plot-schemes')
        .getPublicUrl(filePath);

      onSchemeUploaded(publicUrl);
      toast.success('Схема участков успешно загружена');
    } catch (error) {
      console.error('Error uploading scheme:', error);
      toast.error('Ошибка загрузки схемы');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const removeScheme = () => {
    onSchemeUploaded('');
    toast.success('Схема удалена');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileImage className="w-5 h-5" />
          Схема участков
        </CardTitle>
        <CardDescription>
          Загрузите изображение схемы участков для отображения на карте
        </CardDescription>
      </CardHeader>
      <CardContent>
        {currentScheme ? (
          <div className="space-y-4">
            <div className="relative">
              <img 
                src={currentScheme} 
                alt="Схема участков"
                className="w-full h-48 object-contain border rounded-lg bg-muted/10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="w-4 h-4 mr-2" />
                Заменить схему
              </Button>
              <Button
                variant="outline"
                onClick={removeScheme}
                disabled={uploading}
              >
                <X className="w-4 h-4 mr-2" />
                Удалить
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
            } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">
              {uploading ? 'Загрузка...' : 'Загрузите схему участков'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Перетащите файл сюда или нажмите для выбора
            </p>
            <p className="text-xs text-muted-foreground">
              Поддерживаются форматы: JPG, PNG, GIF (до 10 МБ)
            </p>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
};
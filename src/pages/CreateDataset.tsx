import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Youtube, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

const CreateDataset: React.FC = () => {
  const [url, setUrl] = useState('');
  const [minDuration, setMinDuration] = useState([5]);
  const [maxDuration, setMaxDuration] = useState([30]);
  const [isLoading, setIsLoading] = useState(false);
  const [urlError, setUrlError] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const validateYouTubeUrl = (url: string): boolean => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/;
    return youtubeRegex.test(url);
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    if (value && !validateYouTubeUrl(value)) {
      setUrlError('Пожалуйста, введите корректную ссылку на YouTube видео');
    } else {
      setUrlError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateYouTubeUrl(url)) {
      setUrlError('Пожалуйста, введите корректную ссылку на YouTube видео');
      return;
    }

    if (minDuration[0] >= maxDuration[0]) {
      toast({
        variant: "destructive",
        title: "Ошибка валидации",
        description: "Минимальная длительность должна быть меньше максимальной",
      });
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.createDataset({
        url,
        min_duration: minDuration[0],
        max_duration: maxDuration[0],
      });

      toast({
        title: "Датасет создан",
        description: "Новый датасет успешно добавлен в обработку",
      });

      navigate('/');
    } catch (error) {
      toast({
        variant: "destructive", 
        title: "Ошибка создания",
        description: error instanceof Error ? error.message : "Не удалось создать датасет",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = url && validateYouTubeUrl(url) && minDuration[0] < maxDuration[0];

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Создать новый датасет</h1>
        <p className="text-foreground-muted">
          Добавьте YouTube видео для автоматической обработки и создания датасета
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Система автоматически скачает аудио, разобьет на сегменты и выполнит транскрипцию. 
          Процесс может занять некоторое время в зависимости от длительности видео.
        </AlertDescription>
      </Alert>

      {/* Form */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold flex items-center">
            <Youtube className="h-5 w-5 mr-2 text-destructive" />
            Параметры датасета
          </h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* YouTube URL */}
            <div className="space-y-2">
              <Label htmlFor="url">YouTube ссылка</Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                required
                disabled={isLoading}
                className={urlError ? 'border-destructive focus:border-destructive' : ''}
              />
              {urlError && (
                <p className="text-sm text-destructive">{urlError}</p>
              )}
              <p className="text-sm text-foreground-muted">
                Поддерживаются ссылки вида youtube.com/watch?v= и youtu.be/
              </p>
            </div>

            {/* Duration Range */}
            <div className="space-y-6">
              <div className="space-y-4">
                <Label>Длительность сегментов</Label>
                
                {/* Min Duration */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Минимальная длительность</span>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-foreground-muted" />
                      <span className="text-sm font-medium">{minDuration[0]} сек</span>
                    </div>
                  </div>
                  <Slider
                    value={minDuration}
                    onValueChange={setMinDuration}
                    max={60}
                    min={1}
                    step={1}
                    className="w-full"
                    disabled={isLoading}
                  />
                </div>

                {/* Max Duration */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Максимальная длительность</span>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-foreground-muted" />
                      <span className="text-sm font-medium">{maxDuration[0]} сек</span>
                    </div>
                  </div>
                  <Slider
                    value={maxDuration}
                    onValueChange={setMaxDuration}
                    max={120}
                    min={5}
                    step={1}
                    className="w-full"
                    disabled={isLoading}
                  />
                </div>

                <p className="text-sm text-foreground-muted">
                  Аудио будет разбито на сегменты длительностью от {minDuration[0]} до {maxDuration[0]} секунд
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-3">
              <Button 
                type="submit" 
                className="flex-1 bg-primary hover:bg-primary-hover"
                disabled={!isFormValid || isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Создание...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Создать датасет
                  </>
                )}
              </Button>
              
              <Button 
                type="button" 
                variant="secondary"
                onClick={() => navigate('/')}
                disabled={isLoading}
              >
                Отмена
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      {/* Additional Info */}
      <div className="bg-background-muted rounded-lg p-4 space-y-2">
        <h3 className="font-medium">Этапы обработки:</h3>
        <ul className="text-sm text-foreground-muted space-y-1">
          <li>1. Скачивание аудио с YouTube</li>
          <li>2. Сегментация аудио по заданным параметрам</li>
          <li>3. Автоматическая транскрипция сегментов</li>
          <li>4. Подготовка к ручной проверке</li>
        </ul>
      </div>
    </div>
  );
};

export default CreateDataset;
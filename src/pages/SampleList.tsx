import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileAudio, Clock, Hash, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { Sample, SampleStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';

const SampleList: React.FC = () => {
  const { datasetId } = useParams<{ datasetId: string }>();
  const navigate = useNavigate();
  const [samples, setSamples] = useState<Sample[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const { toast } = useToast();

  const statusColors: Record<SampleStatus, string> = {
    [SampleStatus.NEW]: 'bg-status-info/20 text-status-info border-status-info/30',
    [SampleStatus.IN_PROGRESS]: 'bg-status-processing/20 text-status-processing border-status-processing/30',
    [SampleStatus.COMPLETED]: 'bg-status-success/20 text-status-success border-status-success/30',
    [SampleStatus.REVIEWED]: 'bg-status-success/20 text-status-success border-status-success/30',
  };

  const statusLabels: Record<SampleStatus, string> = {
    [SampleStatus.NEW]: 'Новый',
    [SampleStatus.IN_PROGRESS]: 'В обработке',
    [SampleStatus.COMPLETED]: 'Завершено',
    [SampleStatus.REVIEWED]: 'Проверено',
  };

  const fetchSamples = async () => {
    if (!datasetId) return;
    
    setIsLoading(true);
    try {
      const response = await apiClient.getSamplesByDataset(
        parseInt(datasetId),
        page,
        limit
      );
      setSamples(response.samples);
      setTotal(response.total);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка загрузки",
        description: error instanceof Error ? error.message : "Не удалось загрузить образцы",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSamples();
  }, [datasetId, page]);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalPages = Math.ceil(total / limit);

  if (!datasetId) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-destructive">Не указан ID датасета</p>
          <Button onClick={() => navigate('/')}>Вернуться к датасетам</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к датасетам
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Образцы датасета #{datasetId}</h1>
            <p className="text-foreground-muted">
              Аудио сегменты для анотации и проверки
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={fetchSamples} variant="secondary" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Обновить
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Hash className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-foreground-muted">Всего образцов</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <FileAudio className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-foreground-muted">Страница</p>
                <p className="text-2xl font-bold">{page} из {totalPages}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-brand-secondary/10 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-brand-secondary" />
              </div>
              <div>
                <p className="text-sm text-foreground-muted">На странице</p>
                <p className="text-2xl font-bold">{samples.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Samples List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : samples.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileAudio className="h-12 w-12 text-foreground-muted mb-4" />
              <h3 className="text-lg font-semibold mb-2">Образцы не найдены</h3>
              <p className="text-foreground-muted text-center">
                В данном датасете пока нет обработанных образцов
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {samples.map((sample) => (
              <Card key={sample.id} className="hover:shadow-card transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center">
                        <FileAudio className="h-6 w-6 text-primary" />
                      </div>
                      
                      <div className="space-y-1">
                        <h3 className="font-medium">{sample.filename}</h3>
                        <div className="flex items-center space-x-4 text-sm text-foreground-muted">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDuration(sample.duration)}
                          </span>
                          <span>ID: {sample.id}</span>
                          <span>{formatDate(sample.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Badge className={statusColors[sample.status]} variant="outline">
                        {statusLabels[sample.status]}
                      </Badge>
                    </div>
                  </div>

                  {/* Transcription text if available */}
                  {sample.text && (
                    <div className="mt-3 p-3 bg-background-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Транскрипция:</p>
                      <p className="text-sm text-foreground-muted italic">
                        "{sample.text}"
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 1 || isLoading}
          >
            Предыдущая
          </Button>
          
          <span className="text-sm text-foreground-muted px-4">
            Страница {page} из {totalPages}
          </span>
          
          <Button
            variant="secondary" 
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages || isLoading}
          >
            Следующая
          </Button>
        </div>
      )}
    </div>
  );
};

export default SampleList;
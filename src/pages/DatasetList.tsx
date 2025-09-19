import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Calendar,
  ExternalLink,
  Clock,
  Database as DatabaseIcon,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/lib/api';
import { Dataset, DatasetStatus, DatasetFilters } from '@/types';
import { useToast } from '@/hooks/use-toast';

const DatasetList: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<DatasetFilters>({
    limit: 10,
    offset: 0,
  });
  const { toast } = useToast();

  const statusColors: Record<DatasetStatus, string> = {
    [DatasetStatus.INITIALIZING]: 'bg-status-info text-white',
    [DatasetStatus.SAMPLING]: 'bg-status-processing text-white',
    [DatasetStatus.SAMPLED]: 'bg-status-success text-white',
    [DatasetStatus.TRANSCRIBING]: 'bg-status-processing text-white',
    [DatasetStatus.FAILED_TRANSCRIPTION]: 'bg-status-error text-white',
    [DatasetStatus.SEMY_TRANSCRIBED]: 'bg-status-warning text-white',
    [DatasetStatus.REVIEW]: 'bg-status-warning text-white',
    [DatasetStatus.READY]: 'bg-status-success text-white',
    [DatasetStatus.ERROR]: 'bg-status-error text-white',
  };

  const statusLabels: Record<DatasetStatus, string> = {
    [DatasetStatus.INITIALIZING]: 'Инициализация',
    [DatasetStatus.SAMPLING]: 'Сегментация',
    [DatasetStatus.SAMPLED]: 'Сегментировано',
    [DatasetStatus.TRANSCRIBING]: 'Транскрипция',
    [DatasetStatus.FAILED_TRANSCRIPTION]: 'Ошибка транскрипции',
    [DatasetStatus.SEMY_TRANSCRIBED]: 'Частично транскрибировано',
    [DatasetStatus.REVIEW]: 'На проверке',
    [DatasetStatus.READY]: 'Готово',
    [DatasetStatus.ERROR]: 'Ошибка',
  };

  const fetchDatasets = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getDatasets(filters);
      setDatasets(response.items);
      setTotal(response.total);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка загрузки",
        description: error instanceof Error ? error.message : "Не удалось загрузить датасеты",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, [filters]);

  const handleFilterChange = (key: keyof DatasetFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: 0, // Reset pagination when filtering
    }));
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '—';
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}ч ${minutes % 60}м`;
    }
    return `${minutes}м ${Math.floor(seconds % 60)}с`;
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Датасеты</h1>
          <p className="text-foreground-muted">
            Управление коллекциями данных YouTube
          </p>
        </div>
        <Button onClick={fetchDatasets} variant="secondary" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Обновить
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Фильтры</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search by name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Поиск по названию</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-foreground-muted" />
                <Input
                  placeholder="Название датасета..."
                  value={filters.name_search || ''}
                  onChange={(e) => handleFilterChange('name_search', e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Status filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Статус</label>
              <Select 
                value={filters.status || 'all'} 
                onValueChange={(value) => 
                  handleFilterChange('status', value === 'all' ? undefined : value as DatasetStatus)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Все статусы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date from */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Дата с</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-foreground-muted" />
                <Input
                  type="date"
                  value={filters.created_from || ''}
                  onChange={(e) => handleFilterChange('created_from', e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Date to */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Дата до</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-foreground-muted" />
                <Input
                  type="date"
                  value={filters.created_to || ''}
                  onChange={(e) => handleFilterChange('created_to', e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-foreground-muted">
            Найдено {total} датасетов
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : datasets.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <DatabaseIcon className="h-12 w-12 text-foreground-muted mb-4" />
              <h3 className="text-lg font-semibold mb-2">Датасеты не найдены</h3>
              <p className="text-foreground-muted text-center">
                Попробуйте изменить параметры фильтрации
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {datasets.map((dataset) => (
              <Card key={dataset.id} className="hover:shadow-card-lg transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{dataset.name}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={statusColors[dataset.status]}>
                              {statusLabels[dataset.status]}
                            </Badge>
                            <span className="text-sm text-foreground-muted">
                              ID: {dataset.id}
                            </span>
                          </div>
                        </div>
                        <Link to={`/datasets/${dataset.id}/samples`}>
                          <Button variant="secondary" size="sm">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Открыть
                          </Button>
                        </Link>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-foreground-muted">Образцов:</span>
                          <p className="font-medium">{dataset.count_of_samples}</p>
                        </div>
                        <div>
                          <span className="text-foreground-muted">Длительность:</span>
                          <p className="font-medium">{formatDuration(dataset.duration)}</p>
                        </div>
                        <div>
                          <span className="text-foreground-muted">Создан:</span>
                          <p className="font-medium">{formatDate(dataset.created_at)}</p>
                        </div>
                        <div>
                          <span className="text-foreground-muted">Обновлен:</span>
                          <p className="font-medium">{formatDate(dataset.last_update)}</p>
                        </div>
                      </div>

                      {/* URL */}
                      <div className="flex items-center space-x-2 text-sm">
                        <Clock className="h-4 w-4 text-foreground-muted" />
                        <a 
                          href={dataset.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary-hover underline truncate"
                        >
                          {dataset.url}
                        </a>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DatasetList;
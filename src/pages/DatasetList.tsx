import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Database as DatabaseIcon,
  RefreshCw,
  ChevronDown,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/Pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { apiClient } from '@/lib/api';
import { Dataset, DatasetStatus, DatasetFilters } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { DatasetWebSocket, WebSocketProgress } from '@/lib/ws';
import { useAuth } from '@/contexts/AuthContext';


const DatasetList: React.FC = () => {
  const {user} = useAuth();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<DatasetFilters>({
    limit: 8,
    page: 1,
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  // Обработчик изменения страницы
  const handlePageChange = (page: number) => {
    setFilters(prev => ({
      ...prev,
      page: page
    }));
  };

  // WebSocket состояния
  const [wsProgress, setWsProgress] = useState<Record<number, WebSocketProgress>>({});
  const wsConnections = useRef<Record<number, DatasetWebSocket>>({});
  
  // Состояние для popover транскрипции
  const [transcriptionPopoverOpen, setTranscriptionPopoverOpen] = useState<Record<number, boolean>>({});

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

  const transcriptionOptions = [
    { name: 'Aitil Whisper' },
    { name: 'Gemini 2.0' },
    { name: 'Gemini 2.5' }
  ];

  // WebSocket обработчик прогресса
  const handleWebSocketProgress = (datasetId: number, data: WebSocketProgress) => {
    setWsProgress(prev => ({
      ...prev,
      [datasetId]: data
    }));
  };

  // Подключение WebSocket для датасетов в процессе
  useEffect(() => {
    datasets.forEach(ds => {
      const isProcessing = ds.status === DatasetStatus.TRANSCRIBING || 
                          ds.status === DatasetStatus.SAMPLING || 
                          ds.status === DatasetStatus.INITIALIZING;
      
      if (isProcessing && !wsConnections.current[ds.id]) {
        const ws = new DatasetWebSocket(ds.id, (data) => handleWebSocketProgress(ds.id, data));
        ws.connect();
        wsConnections.current[ds.id] = ws;
      } else if (!isProcessing && wsConnections.current[ds.id]) {
        wsConnections.current[ds.id].disconnect();
        delete wsConnections.current[ds.id];
        setWsProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[ds.id];
          return newProgress;
        });
      }
    });

    return () => {
      Object.values(wsConnections.current).forEach(ws => ws.disconnect());
      wsConnections.current = {};
    };
  }, [datasets]);

  useEffect(() => {
    const completedIds = Object.entries(wsProgress)
      .filter(([_, progress]) => progress.progress === 100)
      .map(([id]) => parseInt(id));

    if (completedIds.length === 0) return;

    const disconnectAndUpdate = async () => {
      await Promise.all(
        completedIds.map(async (id) => {
          try {
            wsConnections.current[id]?.disconnect();
            delete wsConnections.current[id];

            setWsProgress(prev => {
              const newProgress = { ...prev };
              delete newProgress[id];
              return newProgress;
            });

            const updatedDataset = await apiClient.fetchDataset(id);
             setDatasets(prev =>
              prev.map(ds => (ds.id === id ? updatedDataset : ds))
            );
          } catch (e: any) {
            console.error(`Ошибка при обновлении датасета ${id}:`, e.message);
          }
        })
      );
    };

    disconnectAndUpdate();
  }, [wsProgress]);

  const fetchDatasets = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getDatasets(filters);
      setDatasets(response.items);
      setTotal(response.total);
      // Правильно вычисляем общее количество страниц
      setTotalPages(Math.ceil(response.total / filters.limit));
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
      // При изменении любого фильтра сбрасываем на первую страницу
      page: 1,
    }));
  };

  const handleCardClick = (datasetId: number) => {
    navigate(`/datasets/${datasetId}/samples`);
  };

  const handleTranscribe = async (datasetId: number, modelName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const response = await apiClient.startTranscription(datasetId, modelName);
  
      toast({
        title: "Транскрипция запущена",
        description: `${response.message} (${modelName})`,
        duration: 3000,
        className: "bg-green-500 text-white",
      });

      setTranscriptionPopoverOpen(prev => ({
        ...prev,
        [datasetId]: false
      }));
  
      setTimeout(async () => {
        try {
          await fetchDatasets();
        } catch (e: any) {
          console.error(`Ошибка при обновлении датасетов после старта транскрипции:`, e.message);
        }
      }, 500);
  
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || 'Не удалось запустить транскрипцию',
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleDelete = async (datasetId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!window.confirm('Вы уверены, что хотите удалить этот датасет?')) return;

    try {
      await apiClient.deleteDataset(datasetId);
      toast({
        title: 'Датасет удалён',
        description: 'Датасет успешно удалён',
        duration: 1000,
        className: "bg-green-500 text-white",
      });
      await fetchDatasets();
    } catch (error: any) {
      toast({
        title: 'Ошибка удаления',
        description: error.message || 'Не удалось удалить датасет',
        variant: 'destructive',
        duration: 1000,
      });
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '—';
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}ч ${minutes % 60}м`;
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

  const getProgressValue = (dataset: Dataset) => {
    if (wsProgress[dataset.id]) return wsProgress[dataset.id].progress;
    return 0;
  };

  const shouldShowTranscriptionButton = (dataset: Dataset) => {
    return((dataset.status === DatasetStatus.SAMPLED ||
            dataset.status === DatasetStatus.FAILED_TRANSCRIPTION ||
            dataset.status === DatasetStatus.SEMY_TRANSCRIBED) &&
            user.role === 'admin'
    );
  };

  const shouldShowProgress = (dataset: Dataset) => {
    return dataset.status === DatasetStatus.TRANSCRIBING || 
           dataset.status === DatasetStatus.SAMPLING || 
           dataset.status === DatasetStatus.INITIALIZING;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Датасеты</h1>
        </div>
        <Button onClick={fetchDatasets} variant="secondary" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Обновить
        </Button>
      </div>

      {/* Filters */}
      <Card className='pt-4'>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <SelectContent className='bg-white dark:bg-black'>
                  <SelectItem value="all">Все статусы</SelectItem>
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Дата с</label>
              <Input
                type="date"
                value={filters.created_from || ''}
                onChange={(e) => handleFilterChange('created_from', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Дата до</label>
              <Input
                type="date"
                value={filters.created_to || ''}
                onChange={(e) => handleFilterChange('created_to', e.target.value)}
              />
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
              <Card
                key={dataset.id}
                className="hover:shadow-card-lg transition-all duration-200 cursor-pointer hover:bg-muted/30 relative"
                onClick={() => handleCardClick(dataset.id)}
              >
                <CardContent className="p-6 relative">
                  {/* Абсолютный статус */}
                  <div className="absolute top-0 right-0">
                    <div className={`${statusColors[dataset.status]} p-1 text-xs rounded-bl-md rounded-tr-md`}>
                      {statusLabels[dataset.status]}
                    </div>
                  </div>

                  {/* Заголовок */}
                  <h3 className="text-base md:text-lg lg:text-xl font-semibold w-full mb-4">
                    {dataset.name}
                  </h3>

                  {/* Прогресс бар */}
                  {shouldShowProgress(dataset) && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-foreground-muted flex items-center gap-1">
                          {wsProgress[dataset.id]?.task || `Processing ${statusLabels[dataset.status]}`}
                          <span className="inline-block w-1 h-1 bg-current rounded-full animate-pulse"></span>
                        </span>
                        <span className="text-foreground-muted">
                          {Math.round(getProgressValue(dataset))}%
                        </span>
                      </div>
                      <Progress value={getProgressValue(dataset)} className="h-2 mt-1" />
                    </div>
                  )}

                  {/* Нижняя часть */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Информация слева */}
                    <div className="flex space-x-6 text-sm md:text-base">
                      <div>
                        <span className="text-foreground-muted">Образцов:</span>
                        <p className="font-medium">{dataset.count_of_samples}</p>
                      </div>
                      <div>
                        <span className="text-foreground-muted">Длительность:</span>
                        <p className="font-medium">{formatDuration(dataset.duration)}</p>
                      </div>
                    </div>

                    {/* Кнопки справа */}
                    <div className="flex items-center space-x-2">
                      {shouldShowTranscriptionButton(dataset) && (
                        <Popover
                          open={transcriptionPopoverOpen[dataset.id] || false}
                          onOpenChange={(open) => {
                            setTranscriptionPopoverOpen(prev => ({
                              ...prev,
                              [dataset.id]: open,
                            }));
                          }}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span>Auto Transcribe</span>
                              <ChevronDown className="h-4 w-4 ml-1" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2 bg-white dark:bg-black">
                            <div className="space-y-1">
                              {transcriptionOptions.map((option) => (
                                <button
                                  key={option.name}
                                  className="w-full px-3 py-2 text-left hover:bg-muted rounded text-sm transition-colors"
                                  onClick={(e) => handleTranscribe(dataset.id, option.name, e)}
                                >
                                  {option.name}
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}

                      {user.role === 'admin' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => handleDelete(dataset.id, e)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Удалить
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

            ))}
          </div>
        )}
      </div>

      {/* Pagination */}

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination 
            currentPage={filters.page} 
            totalPages={totalPages} 
            onPageChange={handlePageChange} 
          />
        </div>
      )}
    </div>
  );
};

export default DatasetList;
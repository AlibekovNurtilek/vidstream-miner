import React from 'react';
import { BarChart3, Users, TrendingUp, Award, Database, FileAudio } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AnnotatorStats {
  id: number;
  username: string;
  totalAnnotations: number;
  completedSamples: number;
  reviewedSamples: number;
  accuracy: number;
  lastActive: string;
}

const Statistics: React.FC = () => {
  // Mock data - in real app this would come from API
  const annotatorStats: AnnotatorStats[] = [
    {
      id: 1,
      username: 'annotator1',
      totalAnnotations: 245,
      completedSamples: 189,
      reviewedSamples: 156,
      accuracy: 94.5,
      lastActive: '2025-09-19T14:30:00Z',
    },
    {
      id: 2,
      username: 'annotator2', 
      totalAnnotations: 178,
      completedSamples: 142,
      reviewedSamples: 125,
      accuracy: 91.2,
      lastActive: '2025-09-19T12:15:00Z',
    },
    {
      id: 3,
      username: 'annotator3',
      totalAnnotations: 312,
      completedSamples: 278,
      reviewedSamples: 245,
      accuracy: 96.8,
      lastActive: '2025-09-19T16:45:00Z',
    },
  ];

  const systemStats = {
    totalDatasets: 24,
    totalSamples: 1456,
    completedSamples: 1089,
    reviewedSamples: 892,
    avgProcessingTime: '2.3 мин',
    totalDuration: '8.5 часов',
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAccuracyBadge = (accuracy: number) => {
    if (accuracy >= 95) return 'bg-status-success text-white';
    if (accuracy >= 90) return 'bg-status-warning text-white';
    return 'bg-status-error text-white';
  };

  const getPerformanceLevel = (annotations: number) => {
    if (annotations >= 300) return { level: 'Высокая', color: 'text-status-success' };
    if (annotations >= 200) return { level: 'Средняя', color: 'text-status-warning' };
    return { level: 'Низкая', color: 'text-status-error' };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Статистика работы</h1>
        <p className="text-foreground-muted">
          Анализ производительности аннотаторов и системы
        </p>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-foreground-muted">Всего датасетов</p>
                <p className="text-2xl font-bold">{systemStats.totalDatasets}</p>
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
                <p className="text-sm text-foreground-muted">Всего образцов</p>
                <p className="text-2xl font-bold">{systemStats.totalSamples}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-status-success/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-status-success" />
              </div>
              <div>
                <p className="text-sm text-foreground-muted">Завершено</p>
                <p className="text-2xl font-bold">{systemStats.completedSamples}</p>
                <p className="text-xs text-foreground-muted">
                  {Math.round((systemStats.completedSamples / systemStats.totalSamples) * 100)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Annotator Statistics */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Статистика аннотаторов</h2>
        </div>

        <div className="grid gap-4">
          {annotatorStats.map((annotator, index) => (
            <Card key={annotator.id} className="hover:shadow-card transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center">
                      <div className="text-lg font-bold text-primary">
                        #{index + 1}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold">{annotator.username}</h3>
                        <Badge className={getAccuracyBadge(annotator.accuracy)}>
                          Точность: {annotator.accuracy}%
                        </Badge>
                        <Badge variant="outline" className={getPerformanceLevel(annotator.totalAnnotations).color}>
                          {getPerformanceLevel(annotator.totalAnnotations).level} производительность
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground-muted">
                        Последняя активность: {formatDate(annotator.lastActive)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {index === 0 && (
                      <Badge className="bg-brand-primary text-white">
                        <Award className="h-3 w-3 mr-1" />
                        Лидер
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Detailed Stats */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-background-muted rounded-lg">
                    <p className="text-2xl font-bold text-primary">{annotator.totalAnnotations}</p>
                    <p className="text-sm text-foreground-muted">Всего аннотаций</p>
                  </div>
                  
                  <div className="text-center p-3 bg-background-muted rounded-lg">
                    <p className="text-2xl font-bold text-accent">{annotator.completedSamples}</p>
                    <p className="text-sm text-foreground-muted">Завершено</p>
                  </div>
                  
                  <div className="text-center p-3 bg-background-muted rounded-lg">
                    <p className="text-2xl font-bold text-status-success">{annotator.reviewedSamples}</p>
                    <p className="text-sm text-foreground-muted">Проверено</p>
                  </div>
                  
                  <div className="text-center p-3 bg-background-muted rounded-lg">
                    <p className="text-2xl font-bold text-brand-secondary">
                      {Math.round((annotator.reviewedSamples / annotator.completedSamples) * 100)}%
                    </p>
                    <p className="text-sm text-foreground-muted">Качество</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Общая производительность команды</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {annotatorStats.reduce((sum, a) => sum + a.totalAnnotations, 0)}
              </div>
              <p className="text-foreground-muted">Общее количество аннотаций</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-accent mb-2">
                {(annotatorStats.reduce((sum, a) => sum + a.accuracy, 0) / annotatorStats.length).toFixed(1)}%
              </div>
              <p className="text-foreground-muted">Средняя точность</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-status-success mb-2">
                {Math.round(annotatorStats.reduce((sum, a) => sum + a.totalAnnotations, 0) / annotatorStats.length)}
              </div>
              <p className="text-foreground-muted">Среднее кол-во аннотаций</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Statistics;
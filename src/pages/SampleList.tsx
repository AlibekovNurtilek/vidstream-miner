import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Pagination } from '@/components/Pagination';
import { Loader2, ChevronsUpDown } from 'lucide-react';
import { AudioPlayer } from '@/components/AudioPlayer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { apiClient } from '@/lib/api';
import { DatasetSample } from '@/types';

import {API_BASE_URL} from '@/conf';

const SampleList: React.FC = () => {
  const { datasetId } = useParams<{ datasetId: string }>();
  const [samples, setSamples] = useState<DatasetSample[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSamples, setTotalSamples] = useState(0);
  const [samplesLoading, setSamplesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const itemsPerPage = 10;
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'UNREVIEWED' | 'APPROVED' | 'REJECTED'>('ALL');
  const [search, setSearch] = useState('');
  const [editingTexts, setEditingTexts] = useState<Record<number, string>>({});
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [fromIndex, setFromIndex] = useState<number | null>(null);
  const [toIndex, setToIndex] = useState<number | null>(null);

  // Загружаем сэмплы
  const loadSamples = useCallback(async () => {
    if (!datasetId) return;
    setSamplesLoading(true);
    try {
      const samplesData = await apiClient.fetchDatasetSamples(
        Number(datasetId),
        currentPage,
        itemsPerPage,
        filterStatus === 'ALL' ? undefined : filterStatus,
        search,
        fromIndex,
        toIndex
      );
      setSamples(samplesData.samples);
      setTotalSamples(samplesData.total);
      setTotalPages(Math.ceil(samplesData.total / itemsPerPage));
      const newEditing: Record<number, string> = {};
      samplesData.samples.forEach((s) => {
        newEditing[s.id] = s.text;
      });
      setEditingTexts(newEditing);
    } catch (e: any) {
      setError(e.message || 'Ошибка загрузки сэмплов');
    } finally {
      setSamplesLoading(false);
    }
  }, [datasetId, currentPage, itemsPerPage, filterStatus, search, fromIndex, toIndex]);

  useEffect(() => {
    loadSamples();
  }, [loadSamples]);

  const handlePageChange = (page: number) => setCurrentPage(page);

  const getAudioUrl = (filename: string) => {
    if (!datasetId) return '';
    return `${API_BASE_URL}/audio/stream?dataset_id=${datasetId}&filename=${encodeURIComponent(filename)}`;
  };

  const handleApprove = async (sample: DatasetSample) => {
    setActionLoading((prev) => ({ ...prev, [sample.id]: true }));
    try {
      window.dispatchEvent(new Event('pauseAllAudio'));
      if (editingTexts[sample.id] !== sample.text) {
        await apiClient.updateSampleText(sample.id, editingTexts[sample.id]);
      }
      await apiClient.approveSample(sample.id);
      await loadSamples(); // 🔥 обновляем список
    } catch (e) {
      alert('Ошибка при approve: ' + (e as any).message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [sample.id]: false }));
    }
  };

  const handleReject = async (sample: DatasetSample) => {
    setActionLoading((prev) => ({ ...prev, [sample.id]: true }));
    try {
      window.dispatchEvent(new Event('pauseAllAudio'));
      await apiClient.rejectSample(sample.id);
      await loadSamples(); // 🔥 обновляем список
    } catch (e) {
      alert('Ошибка при reject: ' + (e as any).message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [sample.id]: false }));
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-col bg-card/80 shadow-lg rounded-2xl sm:p-6 border border-border md:flex-row gap-2 md:gap-4 items-stretch mb-2">
          <div className="w-full md:w-1/2 h-full">
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={filterOpen}
                  className="w-full h-12 justify-between bg-white dark:bg-black border hover:none border-black/20"
                >
                  {filterStatus === 'ALL'
                    ? 'All Samples'
                    : filterStatus === 'UNREVIEWED'
                    ? 'Not processed'
                    : filterStatus === 'APPROVED'
                    ? 'Approved'
                    : 'Rejected'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 bg-white dark:bg-black overflow-hidden">
                <div className="flex flex-col">
                  {['ALL', 'UNREVIEWED', 'APPROVED', 'REJECTED'].map((status) => (
                    <button
                      key={status}
                      className="px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => {
                        setFilterStatus(status as any);
                        setFilterOpen(false);
                      }}
                    >
                      {status === 'ALL'
                        ? 'All Samples'
                        : status === 'UNREVIEWED'
                        ? 'Not processed'
                        : status === 'APPROVED'
                        ? 'Approved'
                        : 'Rejected'}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="w-full h-full md:w-1/2 flex gap-2">
            <Input
              type="number"
              min={0}
              placeholder="From index"
              value={fromIndex ?? ''}
              onChange={(e) => setFromIndex(e.target.value ? Number(e.target.value) : null)}
              className="w-1/2 h-12 bg-white border border-black/20 dark:bg-black"
            />
            <Input
              type="number"
              min={0}
              placeholder="To index"
              value={toIndex ?? ''}
              onChange={(e) => setToIndex(e.target.value ? Number(e.target.value) : null)}
              className="w-1/2 h-12 bg-white border border-black/20 dark:bg-black"
            />
          </div>

          <div className="w-full h-full md:w-1/2">
            <Input
              placeholder="Поиск по тексту или имени файла..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 bg-white border border-black/20 dark:bg-black"
            />
          </div>
        </div>

        {/* Samples */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Аудио сэмплы</h2>
            <div className="text-sm text-muted-foreground">
              Страница {currentPage} из {totalPages} • Всего: {totalSamples}
            </div>
          </div>

          {samplesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : samples.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Сэмплы не найдены</div>
          ) : (
            <div className="space-y-4">
              {samples.map((sample) => (
          <Card
            key={sample.id}
            className="w-full rounded-2xl border border-black/10 shadow-md hover:shadow-lg transition-all 
                      bg-white dark:bg-neutral-900 dark:border-white/10 dark:shadow-black/40"
          >
            <CardContent className="p-6 space-y-5">
              {/* Аудио */}
              <div className="border-b pb-4 border-black/10 dark:border-white/10">
                <AudioPlayer src={getAudioUrl(sample.filename)} />
              </div>

              {/* Имя файла */}
              <div className="text-sm text-black dark:text-gray-200">
                {sample.filename.replace(/\.wav$/, '')}
              </div>

              {/* Текст + кнопки */}
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-stretch">
                <Textarea
                  className="flex-1 min-w-0 resize-none border border-black/[0.15] bg-white text-sm rounded-xl p-3
                            dark:bg-neutral-800 dark:border-white/20 dark:text-gray-100 dark:placeholder-gray-400"
                  value={editingTexts[sample.id] ?? sample.text ?? ''}
                  placeholder="Еще не семплировано"
                  onChange={(e) =>
                    setEditingTexts((prev) => ({ ...prev, [sample.id]: e.target.value }))
                  }
                />

                <div className="flex flex-row md:flex-col gap-2 md:gap-3 justify-end min-w-[120px]">
                  <Button
                    variant="default"
                    className="bg-green-700 text-white hover:bg-green-800
                              dark:bg-green-800 dark:hover:bg-green-900"
                    onClick={() => handleApprove(sample)}
                    disabled={actionLoading[sample.id]}
                  >
                    {actionLoading[sample.id] ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Approve'
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    className="bg-red-800 text-white hover:bg-red-900
                              dark:bg-red-900 dark:hover:bg-red-950"
                    onClick={() => handleReject(sample)}
                    disabled={actionLoading[sample.id]}
                  >
                    {actionLoading[sample.id] ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Reject'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SampleList;

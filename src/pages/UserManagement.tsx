import React, { useEffect, useState } from 'react';
import { Users, Plus, UserX, Shield, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserRole } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

const UserManagement: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: UserRole.VIEWER,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // ---------------- USERS STATE ----------------
  const [users, setUsers] = useState<{ id: number; username: string; role: string }[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const roleLabels: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'Админ',
    [UserRole.ANNOTATOR]: 'Аннотатор',
    [UserRole.VIEWER]: 'Наблюдатель',
  };

  const newUserRoles: Record<string, string> = {
    "annotator": 'Аннотатор',
    "viewer": 'Наблюдатель',
  };

  const roleIcons: Record<UserRole, React.ReactNode> = {
    [UserRole.ADMIN]: <Shield className="h-4 w-4" />,
    [UserRole.ANNOTATOR]: <Edit className="h-4 w-4" />,
    [UserRole.VIEWER]: <Eye className="h-4 w-4" />,
  };

  // ---------------- FETCH USERS ----------------
  const fetchUsers = async (pageNum: number = 1) => {
    try {
      const res = await apiClient.getUsers(pageNum, pageSize);
      setUsers(res.users);
      setTotal(res.total);
      setPage(res.page);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка загрузки",
        description: error instanceof Error ? error.message : "Не удалось загрузить пользователей",
      });
    }
  };

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  // ---------------- CREATE USER ----------------
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiClient.register(newUser);
      toast({
        title: "Пользователь создан",
        description: `Пользователь ${newUser.username} успешно добавлен в систему`,
      });
      setNewUser({ username: '', password: '', role: UserRole.VIEWER });
      setIsCreateDialogOpen(false);
      fetchUsers(page); // обновляем список
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка создания",
        description: error instanceof Error ? error.message : "Не удалось создать пользователя",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- DELETE USER ----------------
  const handleDeleteUser = async (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить этого пользователя?")) return;

    try {
      await apiClient.deleteUser(id);
      toast({
        title: "Пользователь удалён",
        description: `Пользователь с id ${id} был удалён`,
      });
      fetchUsers(page); // обновляем список
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка удаления",
        description: error instanceof Error ? error.message : "Не удалось удалить пользователя",
      });
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Управление пользователями</h1>
          <p className="text-sm sm:text-base text-foreground-muted">
            Создание и управление учетными записями системы
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-hover w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Создать пользователя</span>
              <span className="sm:hidden">Создать</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Создание нового пользователя</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Имя пользователя</Label>
                <Input
                  id="username"
                  value={newUser.username}
                  onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Введите имя пользователя"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Введите пароль"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Роль</Label>
                <Select 
                  value={newUser.role} 
                  onValueChange={(value: UserRole) => setNewUser(prev => ({ ...prev, role: value }))}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-black">
                    {Object.entries(newUserRoles).map(([key, label]) => (
                      <SelectItem key={key} value={key} className='!hover:bg-slate-600'>
                        <div className="flex items-center space-x-2">
                          {roleIcons[key as UserRole]}
                          <span>{label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={isLoading || !newUser.username || !newUser.password}
                >
                  {isLoading ? 'Создание...' : 'Создать'}
                </Button>
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isLoading}
                  className="flex-1 sm:flex-none"
                >
                  Отмена
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Table - Desktop */}
      <div className="hidden md:block border rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <thead className="bg-muted">
            <tr>
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Имя</th>
              <th className="p-3 text-left">Роль</th>
              <th className="p-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center p-4 text-muted-foreground">
                  Нет пользователей
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className="border-t">
                  <td className="p-3">{user.id}</td>
                  <td className="p-3">{user.username}</td>
                  <td className="p-3">
                    <div className="flex items-center space-x-2">
                      {roleIcons[user.role]}
                      <span>{roleLabels[user.role]}</span>
                    </div>
                  </td>
                  <td className="p-3 text-right">
                     <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={user.role === "admin"}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Удалить
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Users Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {users.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground border rounded-lg">
            Нет пользователей
          </div>
        ) : (
          users.map(user => (
            <div key={user.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">#{user.id}</div>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => handleDeleteUser(user.id)}
                  disabled={user.role === "admin"}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Имя пользователя</div>
                <div className="font-medium">{user.username}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Роль</div>
                <div className="flex items-center space-x-2 mt-1">
                  {roleIcons[user.role]}
                  <span>{roleLabels[user.role]}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <Button 
          variant="secondary" 
          disabled={page === 1} 
          onClick={() => setPage(prev => Math.max(1, prev - 1))}
          className="w-full sm:w-auto"
        >
          Назад
        </Button>
        <span className="text-sm sm:text-base">
          Страница {page} из {Math.ceil(total / pageSize)}
        </span>
        <Button 
          variant="secondary" 
          disabled={page * pageSize >= total} 
          onClick={() => setPage(prev => prev + 1)}
          className="w-full sm:w-auto"
        >
          Вперёд
        </Button>
      </div>
    </div>
  );
};

export default UserManagement;
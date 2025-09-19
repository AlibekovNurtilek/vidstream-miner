import React, { useState } from 'react';
import { Users, Plus, UserX, Shield, Eye, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserRole } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

interface User {
  id: number;
  username: string;
  role: UserRole;
  created_at: string;
  last_active?: string;
}

const UserManagement: React.FC = () => {
  const [users] = useState<User[]>([
    { id: 1, username: 'admin', role: UserRole.ADMIN, created_at: '2025-01-01T00:00:00Z' },
    { id: 2, username: 'annotator1', role: UserRole.ANNOTATOR, created_at: '2025-01-02T00:00:00Z' },
    { id: 3, username: 'viewer1', role: UserRole.VIEWER, created_at: '2025-01-03T00:00:00Z' },
  ]);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: UserRole.VIEWER,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const roleColors: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'bg-destructive text-destructive-foreground',
    [UserRole.ANNOTATOR]: 'bg-accent text-accent-foreground',
    [UserRole.VIEWER]: 'bg-secondary text-secondary-foreground',
  };

  const roleLabels: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'Администратор',
    [UserRole.ANNOTATOR]: 'Аннотатор',
    [UserRole.VIEWER]: 'Наблюдатель',
  };

  const roleIcons: Record<UserRole, React.ReactNode> = {
    [UserRole.ADMIN]: <Shield className="h-4 w-4" />,
    [UserRole.ANNOTATOR]: <Edit className="h-4 w-4" />,
    [UserRole.VIEWER]: <Eye className="h-4 w-4" />,
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiClient.register(newUser);
      
      toast({
        title: "Пользователь создан",
        description: `Пользователь ${newUser.username} успешно добавлен в систему`,
      });

      setNewUser({
        username: '',
        password: '',
        role: UserRole.VIEWER,
      });
      setIsCreateDialogOpen(false);
      
      // In a real app, you would refetch users here
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

  const handleDeleteUser = async (userId: number, username: string) => {
    if (window.confirm(`Вы уверены, что хотите удалить пользователя ${username}?`)) {
      try {
        // In a real app, you would call API to delete user
        toast({
          title: "Пользователь удален",
          description: `Пользователь ${username} удален из системы`,
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Ошибка удаления",
          description: "Не удалось удалить пользователя",
        });
      }
    }
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
          <h1 className="text-3xl font-bold">Управление пользователями</h1>
          <p className="text-foreground-muted">
            Создание и управление учетными записями системы
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-hover">
              <Plus className="h-4 w-4 mr-2" />
              Создать пользователя
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создание нового пользователя</DialogTitle>
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
                  <SelectContent>
                    {Object.entries(roleLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center space-x-2">
                          {roleIcons[key as UserRole]}
                          <span>{label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex space-x-2">
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
                >
                  Отмена
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-foreground-muted">Всего пользователей</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <Edit className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-foreground-muted">Аннотаторов</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.role === UserRole.ANNOTATOR).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-foreground-muted">Администраторов</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.role === UserRole.ADMIN).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Список пользователей</h2>
        
        <div className="grid gap-4">
          {users.map((user) => (
            <Card key={user.id} className="hover:shadow-card transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center">
                      {roleIcons[user.role]}
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold">{user.username}</h3>
                        <Badge className={roleColors[user.role]}>
                          {roleLabels[user.role]}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-foreground-muted">
                        <span>ID: {user.id}</span>
                        <span>Создан: {formatDate(user.created_at)}</span>
                        {user.last_active && (
                          <span>Активен: {formatDate(user.last_active)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {user.role !== UserRole.ADMIN && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id, user.username)}
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Удалить
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
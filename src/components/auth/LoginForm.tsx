import React, { useState } from 'react';
import { Eye, EyeOff, Database, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const LoginForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const success = await login(username, password);
    
    setIsLoading(false);
    
    if (!success) {
      setPassword(''); // Clear password on failed login
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-4">
      <div className="w-full max-w-md space-y-8">

        {/* Login Form */}
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-card-lg">
          <CardHeader className="space-y-1 pb-4">
            <h2 className="text-2xl font-semibold text-center">Вход в систему</h2>
            <p className="text-foreground-muted text-center text-sm">
              Введите свои учетные данные для доступа
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Имя пользователя</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Введите имя пользователя"
                  required
                  disabled={isLoading}
                  className="h-11"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Введите пароль"
                    required
                    disabled={isLoading}
                    className="h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="absolute right-1 top-1 h-9 w-9"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-primary hover:bg-primary-hover"
                disabled={isLoading || !username || !password}
              >
                {isLoading ? 'Вход...' : 'Войти'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-white/60 text-sm">
            Система автоматического сбора данных с YouTube
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
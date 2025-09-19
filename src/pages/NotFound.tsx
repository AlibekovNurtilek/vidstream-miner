import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-primary">404</h1>
          <h2 className="text-2xl font-semibold text-foreground">Страница не найдена</h2>
          <p className="text-foreground-muted">
            Запрашиваемая страница не существует или была перемещена
          </p>
        </div>
        
        <div className="space-y-3">
          <Button asChild className="bg-primary hover:bg-primary-hover">
            <a href="/">Вернуться на главную</a>
          </Button>
          <p className="text-sm text-foreground-muted">
            Путь: {location.pathname}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

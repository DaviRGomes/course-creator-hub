import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Clock } from "lucide-react";

const CatalogPage = () => {
  const navigate = useNavigate();

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["student-courses"],
    queryFn: () => api.get("/courses").then((r) => r.data.data ?? r.data),
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Catálogo de Cursos</h1>
        <p className="text-sm text-muted-foreground mt-1">Explore os cursos disponíveis e comece a aprender</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.filter((c: any) => c.active).map((c: any) => (
            <div
              key={c.id}
              className="bg-card border border-border rounded-xl overflow-hidden transition-fast hover:shadow-lg hover:-translate-y-0.5 group"
            >
              <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <BookOpen className="h-12 w-12 text-primary/40 group-hover:text-primary/60 transition-fast" />
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-foreground">{c.title}</h3>
                  <Badge variant="outline" className="text-xs">
                    {c.active ? "Disponível" : "Inativo"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{c.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {c.modulesCount ?? 0} módulos
                  </span>
                  <Button size="sm" onClick={() => navigate(`/learn/${c.id}`)}>
                    Acessar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CatalogPage;

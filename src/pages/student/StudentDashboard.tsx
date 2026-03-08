import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

const StudentDashboard = () => {
  const { email } = useAuth();
  const navigate = useNavigate();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Olá, {email?.split("@")[0]}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Explore os cursos disponíveis</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground mb-4">Acesse o catálogo para ver os cursos disponíveis.</p>
        <Button onClick={() => navigate("/catalog")}>Ver Catálogo</Button>
      </div>
    </div>
  );
};

export default StudentDashboard;

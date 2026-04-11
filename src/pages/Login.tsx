import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import LogoIcon from "@/components/LogoIcon";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const role = await login(email, password);
      navigate(role === "ADMIN" ? "/admin/users" : "/dashboard", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[hsl(222,47%,11%)] relative flex-col items-center justify-center p-12 overflow-hidden">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
        
        {/* Decorative shapes */}
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-primary/10 rounded-3xl rotate-12" />
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-primary/5 rounded-3xl -rotate-12" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-md">
          <LogoIcon className="w-28 h-28 mb-6" />
          <h1 className="text-xl font-semibold text-white">
            Conexões <span className="text-primary">Sociais</span>
          </h1>
          <div className="w-24 h-1 bg-primary rounded-full mb-8" />
          <p className="text-gray-400 text-sm uppercase tracking-[0.25em]">
            Onde sua transformação acontece
          </p>
        </div>

        <div className="absolute bottom-8 text-center z-10">
          <p className="text-gray-500 text-xs">
            Feito com ♡ para você
          </p>
          <p className="text-gray-600 text-xs mt-1">
            Copyright © {new Date().getFullYear()} — Conexões Sociais. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex flex-col items-center mb-10 lg:mb-12">
            <LogoIcon className="w-16 h-16 mb-3" />
            <h1 className="text-xl font-semibold text-foreground">
              Conexões <span className="text-primary">Sociais</span>
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="h-11"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-fast"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(v) => setRemember(v === true)}
              />
              <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                Lembrar de mim
              </Label>
            </div>

            <Button type="submit" className="w-full h-11 rounded-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {loading ? "Entrando..." : "Entrar"}
            </Button>

            <p className="text-center">
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-primary transition-fast"
                onClick={() => toast.info("Entre em contato com o administrador para redefinir sua senha.")}
              >
                Esqueceu sua senha?
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

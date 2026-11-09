import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, User, AlertCircle, Eye, EyeOff, Briefcase, TrendingUp } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useApp();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUser = identifier.trim();
    if (!cleanUser || !password) {
      setError('Por favor ingrese su usuario y contraseña.');
      return;
    }

    setLoading(true);
    try {
      await login(cleanUser, password);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al autenticar credenciales.';
      setError(msg.includes('401') ? 'Usuario o contraseña incorrectos.' : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#0A1C30] font-sans antialiased overflow-x-hidden">
      {/* Estilos para forzar inputs blancos y evitar el fondo gris de autofill de Chrome/Edge */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px white inset !important;
          -webkit-text-fill-color: #0F172A !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      {/* ========================================================
          COLUMNA IZQUIERDA: BRAND & VALUE SHOWCASE (62% ANCHO)
          Fondo Azul Petróleo #0A1C30 con Maqueta Glassmorphic
          ======================================================== */}
      <div className="hidden lg:flex lg:w-[62%] xl:w-[65%] flex-col justify-between p-10 xl:p-14 relative overflow-hidden bg-[#0A1C30] text-white min-h-screen select-none">
        {/* Resplandores ambientales cyan de fondo */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[340px] bg-cyan-400/20 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute bottom-12 left-1/3 -translate-x-1/2 w-[520px] h-44 bg-cyan-400/20 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 bg-[#00A3FF]/15 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute top-1/4 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl" />

        {/* Velas japonesas y perspectiva financiera de fondo */}
        <div className="pointer-events-none absolute inset-0 opacity-50 overflow-hidden flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 1100 700" fill="none" preserveAspectRatio="none">
            {/* Rejilla de perspectiva tridimensional sutil */}
            <path d="M0 220 H1100" stroke="#00A3FF" strokeWidth="1" strokeDasharray="4 8" opacity="0.25" />
            <path d="M0 360 H1100" stroke="#00A3FF" strokeWidth="1" strokeDasharray="4 8" opacity="0.25" />
            <path d="M0 500 H1100" stroke="#00A3FF" strokeWidth="1" strokeDasharray="4 8" opacity="0.25" />
            
            {/* Líneas diagonales de perspectiva del suelo financiero */}
            <line x1="200" y1="700" x2="450" y2="400" stroke="#00A3FF" strokeWidth="1" opacity="0.15" />
            <line x1="500" y1="700" x2="600" y2="400" stroke="#00A3FF" strokeWidth="1" opacity="0.15" />
            <line x1="800" y1="700" x2="750" y2="400" stroke="#00A3FF" strokeWidth="1" opacity="0.15" />

            {/* Curvas de tendencia cyan brillante que cruzan tras el cristal */}
            <path d="M-50 520 C 220 450, 380 490, 620 340 C 780 230, 920 250, 1150 130" stroke="#00D2FF" strokeWidth="2.5" fill="none" opacity="0.85" />
            <path d="M-50 470 C 200 360, 420 420, 660 280 C 820 170, 940 190, 1150 80" stroke="#00A3FF" strokeWidth="1.5" strokeDasharray="6 6" fill="none" opacity="0.65" />

            {/* Velas a la izquierda */}
            <line x1="90" y1="360" x2="90" y2="520" stroke="#00A3FF" strokeWidth="1.5" opacity="0.6" />
            <rect x="83" y="400" width="14" height="80" fill="#00A3FF" rx="2" opacity="0.5" />

            <line x1="150" y1="310" x2="150" y2="480" stroke="#34D399" strokeWidth="2" opacity="0.75" />
            <rect x="142" y="340" width="16" height="95" fill="#34D399" rx="2" opacity="0.6" />

            <line x1="220" y1="270" x2="220" y2="450" stroke="#00D2FF" strokeWidth="1.5" opacity="0.6" />
            <rect x="213" y="310" width="14" height="90" fill="#00D2FF" rx="2" opacity="0.5" />

            {/* Velas a la derecha que se asoman y transparentan tras el cristal */}
            <line x1="740" y1="220" x2="740" y2="450" stroke="#00D2FF" strokeWidth="2" opacity="0.75" />
            <rect x="732" y="270" width="16" height="130" fill="#00D2FF" rx="3" opacity="0.5" />
            
            <line x1="820" y1="160" x2="820" y2="400" stroke="#34D399" strokeWidth="2.5" opacity="0.9" />
            <rect x="811" y="200" width="18" height="140" fill="#34D399" rx="3" opacity="0.65" />
            
            <line x1="900" y1="120" x2="900" y2="340" stroke="#00D2FF" strokeWidth="2" opacity="0.8" />
            <rect x="892" y="150" width="16" height="110" fill="#00D2FF" rx="3" opacity="0.55" />

            <line x1="980" y1="80" x2="980" y2="280" stroke="#34D399" strokeWidth="2" opacity="0.85" />
            <rect x="972" y="110" width="16" height="120" fill="#34D399" rx="3" opacity="0.6" />
          </svg>
        </div>

        {/* A. Cabecera (Top): Logo Oficial Clear Minds Consultores + Barra Vertical | + Cobranzas + Badge Suite Empresarial */}
        <div className="relative z-10 flex items-center gap-3 xl:gap-4">
          <div className="flex items-center">
            <img 
              src="/assets/clear-minds-consultores-transparent.png" 
              alt="Clear Minds Consultores" 
              className="h-10 sm:h-11 xl:h-12 w-auto object-contain drop-shadow-md"
            />
          </div>

          {/* Línea divisoria vertical fina */}
          <div className="h-8 w-px bg-white/20 mx-1 xl:mx-2" />

          {/* Título Producto: Cobranzas */}
          <span className="text-2xl xl:text-3xl font-bold text-white tracking-tight">
            Cobranzas
          </span>

          {/* Badge Suite Empresarial */}
          <div className="flex items-center gap-1.5 bg-[#14263b] border border-[#233d5d] text-[#cbd5e1] text-xs px-2.5 py-1 rounded-md font-medium shadow-sm ml-1">
            <Briefcase className="w-3.5 h-3.5 text-[#94a3b8]" />
            Suite Empresarial
          </div>
        </div>

        {/* B. Zona Central: Inteligencia Financiera & Maqueta Glassmorphic 1:1 Idéntica al Monitor */}
        <div className="relative z-10 w-full max-w-[620px] mx-auto my-auto py-5">
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-6 tracking-tight">
            Inteligencia Financiera
          </h3>

          {/* Contenedor relativo que permite el desborde (overflow-visible) de los chips flotantes */}
          <div className="relative w-full">
            {/* Chip Flotante Superior Derecho: KPI / Efectividad de Cobro (Sobre el borde superior derecho) */}
            <div 
              className="absolute -top-5 right-4 sm:right-6 z-30 rounded-xl px-4 py-2 flex items-center gap-2.5 shadow-xl"
              style={{
                background: "rgba(10, 24, 42, 0.85)",
                border: "1px solid rgba(255, 255, 255, 0.30)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)"
              }}
            >
              <div 
                className="rounded-md px-2 py-1 flex items-center gap-1.5 font-bold text-xs text-slate-200"
                style={{
                  background: "rgba(255, 255, 255, 0.10)",
                  border: "1px solid rgba(255, 255, 255, 0.18)"
                }}
              >
                <span>KPI</span>
                <TrendingUp className="w-3.5 h-3.5 text-[#34D399]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-300 font-medium leading-tight">Efectividad de Cobro</span>
                <span className="text-sm font-black text-[#34D399] leading-tight mt-0.5">94.2%</span>
              </div>
            </div>

            {/* Chips Flotantes Inferiores Izquierdos: Sobre el borde inferior izquierdo */}
            <div className="absolute -bottom-6 left-4 sm:left-6 z-30 flex items-center gap-3">
              <div 
                className="rounded-xl px-3.5 py-2 shadow-xl flex flex-col justify-center min-w-[95px]"
                style={{
                  background: "rgba(10, 24, 42, 0.85)",
                  border: "1px solid rgba(255, 255, 255, 0.30)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)"
                }}
              >
                <span className="text-[10px] text-slate-300 font-medium leading-tight">Efectividad de</span>
                <span className="text-[10px] text-slate-300 font-medium leading-tight">Cobro</span>
                <span className="text-sm font-black text-[#34D399] mt-0.5">94.2%</span>
              </div>
              <div 
                className="rounded-xl px-3.5 py-2 shadow-xl flex flex-col justify-center min-w-[70px]"
                style={{
                  background: "rgba(10, 24, 42, 0.85)",
                  border: "1px solid rgba(255, 255, 255, 0.30)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)"
                }}
              >
                <span className="text-[11px] text-slate-300 font-medium leading-tight">KPI</span>
                <span className="text-sm font-black text-[#34D399] mt-0.5">92.3%</span>
              </div>
            </div>

            {/* Lámina Base de Cristal Translúcido Esmerilado (Blanco brillante, alto contraste sin plomo) */}
            <div 
              className="w-full rounded-2xl p-6 sm:p-7 shadow-2xl relative"
              style={{
                background: "linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.07) 100%)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: "1.5px solid rgba(255, 255, 255, 0.40)",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.55), inset 0 1px 2px rgba(255, 255, 255, 0.50)"
              }}
            >
              {/* Núcleo de Conciliación en Fila Compacto y Armónico */}
              <div className="flex items-center justify-center gap-3 sm:gap-4 w-full py-1">
                {/* 1. Caja Banco Pichincha (Cristal ahumado con borde reflectante) */}
                <div 
                  className="w-[190px] sm:w-[215px] shrink-0 rounded-xl p-4 sm:p-5 text-center shadow-lg"
                  style={{
                    background: "rgba(10, 24, 42, 0.58)",
                    border: "1px solid rgba(255, 255, 255, 0.30)",
                    backdropFilter: "blur(14px)",
                    WebkitBackdropFilter: "blur(14px)"
                  }}
                >
                  <div className="text-xs sm:text-sm font-semibold text-white tracking-wide">Banco Pichincha</div>
                  <div className="text-[11px] sm:text-xs text-slate-300 mt-1">Transferencia Recibida</div>
                  <div className="text-xl sm:text-2xl font-black text-[#34D399] mt-2 tracking-tight">$450.00</div>
                </div>

                {/* 2. Conector Central Auto-Match (Compacto) */}
                <div className="flex flex-col items-center justify-center shrink-0 px-1 sm:px-2">
                  <span className="text-[11px] sm:text-xs font-semibold text-cyan-300 tracking-wide mb-1.5">
                    Auto-Match
                  </span>
                  <div className="flex items-center text-[#00D2FF]">
                    <div className="h-[2px] w-14 sm:w-16 bg-gradient-to-r from-cyan-400 to-[#00D2FF] rounded-full shadow-[0_0_8px_#00D2FF]" />
                    <div className="w-0 h-0 border-y-[5px] border-y-transparent border-l-[9px] border-l-[#00D2FF] -ml-1 drop-shadow-[0_0_8px_#00D2FF]" />
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold text-cyan-400 mt-1.5 tracking-wide">
                    100%
                  </span>
                </div>

                {/* 3. Caja Usuario (Cristal ahumado con borde reflectante) */}
                <div 
                  className="w-[190px] sm:w-[215px] shrink-0 rounded-xl p-4 sm:p-5 text-center shadow-lg"
                  style={{
                    background: "rgba(10, 24, 42, 0.58)",
                    border: "1px solid rgba(255, 255, 255, 0.30)",
                    backdropFilter: "blur(14px)",
                    WebkitBackdropFilter: "blur(14px)"
                  }}
                >
                  <div className="text-xs sm:text-sm font-semibold text-white tracking-wide">Usuario</div>
                  <div className="text-[11px] sm:text-xs text-slate-300 mt-1">Cuota Febrero</div>
                  <div className="mt-2.5">
                    <span className="inline-block px-3.5 py-1 rounded-md text-xs font-bold text-[#34D399] bg-emerald-500/25 border border-emerald-400/40 shadow-xs">
                      Pagada
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* C. Zona Inferior (Bottom): Titular sólido */}
        <div className="relative z-10 pt-4">
          <h2 className="text-2xl xl:text-3xl font-bold text-white tracking-tight">
            Trazabilidad de cartera y conciliación
          </h2>
        </div>
      </div>

      {/* ========================================================
          COLUMNA DERECHA: FORMULARIO BLANCO LIMPIO
          ======================================================== */}
      <div
        className="w-full lg:w-[38%] xl:w-[35%] flex items-center justify-center p-8 sm:p-12 xl:p-16 min-h-screen"
        style={{ backgroundColor: '#FFFFFF', color: '#0F172A' }}
      >
        <div className="w-full max-w-sm sm:max-w-md space-y-6">
          {/* Cabecera en Móviles (solo visible cuando la columna izquierda se oculta) */}
          <div
            className="lg:hidden flex items-center justify-between pb-4"
            style={{ borderBottom: '1px solid #E2E8F0' }}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-xl font-bold tracking-tight" style={{ color: '#0F172A' }}>
                Clear Minds
              </span>
              <span className="text-lg font-bold tracking-tight" style={{ color: '#00A3FF' }}>
                Cobranzas
              </span>
            </div>
            <span
              className="text-xs px-2.5 py-1 rounded-md font-medium"
              style={{ backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0' }}
            >
              Suite Empresarial
            </span>
          </div>

          {/* Encabezado del Formulario */}
          <div>
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: '#0F172A' }}>
              Acceso al Sistema
            </h2>
            <p className="text-sm mt-1.5" style={{ color: '#64748B' }}>
              Ingresa con tus credenciales asignadas
            </p>
          </div>

          {/* Alerta de Error */}
          {error && (
            <div
              className="p-3.5 rounded-xl text-xs flex items-center gap-2.5"
              style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
          )}

          {/* Formulario de Login */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#334155' }}>
                Usuario o Correo Institucional
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin"
                  disabled={loading}
                  required
                  className="w-full pl-10 pr-4 py-3 sm:py-3.5 rounded-xl text-sm transition shadow-xs focus:outline-none focus:ring-2 focus:ring-[#00A3FF]"
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#0F172A',
                    borderColor: '#CBD5E1',
                    borderWidth: '1px',
                    borderStyle: 'solid'
                  }}
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#334155' }}>
                Contraseña de Acceso
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  required
                  className="w-full pl-10 pr-11 py-3 sm:py-3.5 rounded-xl text-sm transition shadow-xs focus:outline-none focus:ring-2 focus:ring-[#00A3FF]"
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#0F172A',
                    borderColor: '#CBD5E1',
                    borderWidth: '1px',
                    borderStyle: 'solid'
                  }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition p-0.5 cursor-pointer"
                  style={{ color: '#94A3B8' }}
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Botón de Acción Principal */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 font-semibold rounded-xl transition duration-200 shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm mt-3"
              style={{
                backgroundColor: '#00A3FF',
                color: '#FFFFFF'
              }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verificando credenciales...</span>
                </>
              ) : (
                <span>Ingresar al Panel de Cobranzas →</span>
              )}
            </button>
          </form>

          {/* Pie de Formulario */}
          <div className="text-center text-xs pt-8" style={{ color: '#94A3B8' }}>
            Acceso Corporativo Seguro • Clear Minds Consultores
          </div>
        </div>
      </div>
    </div>
  );
};

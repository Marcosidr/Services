import { ArrowLeft, CheckCircle, Eye, EyeOff, AlertCircle, X } from "lucide-react";

export type PasswordResetStep = "login" | "email" | "code" | "password";

type ActivePasswordResetStep = Exclude<PasswordResetStep, "login">;

type PasswordResetModalProps = {
  step: ActivePasswordResetStep;
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
  loading: boolean;
  error: string;
  message: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  onBack: () => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onEmailChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  onToggleConfirmPassword: () => void;
  onChangeEmail: () => void;
  onResendCode: () => void;
};

function getStepTitle(step: ActivePasswordResetStep) {
  if (step === "email") return "Vamos encontrar sua conta";
  if (step === "code") return "Digite o codigo recebido";
  return "Crie sua nova senha";
}

function getStepDescription(step: ActivePasswordResetStep) {
  if (step === "email") {
    return "Informe o e-mail cadastrado. Se ele existir na Zentry, enviaremos um codigo de verificacao.";
  }

  if (step === "code") {
    return "Confira sua caixa de entrada e digite o codigo de 6 digitos enviado para o seu e-mail.";
  }

  return "Codigo confirmado. Agora defina uma senha nova para acessar sua conta.";
}

function getSubmitLabel(step: ActivePasswordResetStep) {
  if (step === "email") return "Enviar codigo";
  if (step === "code") return "Validar codigo";
  return "Salvar nova senha";
}

function PasswordResetModal({
  step,
  email,
  code,
  password,
  confirmPassword,
  loading,
  error,
  message,
  showPassword,
  showConfirmPassword,
  onBack,
  onClose,
  onSubmit,
  onEmailChange,
  onCodeChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onTogglePassword,
  onToggleConfirmPassword,
  onChangeEmail,
  onResendCode
}: PasswordResetModalProps) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-[0_24px_70px_-30px_rgba(15,23,42,0.65)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <span className="text-sm font-semibold text-slate-700">Recuperar senha</span>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{getStepTitle(step)}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{getStepDescription(step)}</p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {step === "email" && (
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">E-mail cadastrado</label>
              <input
                type="email"
                required
                autoFocus
                placeholder="joao@email.com"
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none transition-colors focus:border-primary"
              />
            </div>
          )}

          {step === "code" && (
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Codigo de verificacao</label>
              <input
                type="text"
                inputMode="numeric"
                required
                autoFocus
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(event) => onCodeChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-center text-lg font-semibold tracking-[0.45em] outline-none transition-colors focus:border-primary"
              />
              <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                <button type="button" onClick={onChangeEmail} className="text-slate-500 hover:text-primary">
                  Trocar e-mail
                </button>

                <button
                  type="button"
                  onClick={onResendCode}
                  disabled={loading}
                  className="text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Reenviar codigo
                </button>
              </div>
            </div>
          )}

          {step === "password" && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Nova senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoFocus
                    placeholder="********"
                    value={password}
                    onChange={(event) => onPasswordChange(event.target.value)}
                    className="w-full px-4 py-3 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none transition-colors focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={onTogglePassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Confirmar nova senha</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="********"
                    value={confirmPassword}
                    onChange={(event) => onConfirmPasswordChange(event.target.value)}
                    className="w-full px-4 py-3 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none transition-colors focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={onToggleConfirmPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showConfirmPassword ? "Ocultar confirmacao de senha" : "Mostrar confirmacao de senha"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-1 w-full py-3.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {getSubmitLabel(step)}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PasswordResetModal;

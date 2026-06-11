import { ChevronLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

type BackButtonProps = {
  label?: string;
  className?: string;
};

function BackButton({ label = "Voltar", className = "" }: BackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (location.key && location.key !== "default") {
      navigate(-1);
      return;
    }

    navigate("/");
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/85 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-primary/25 hover:bg-white hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 ${className}`}
    >
      <ChevronLeft className="h-4 w-4" />
      {label}
    </button>
  );
}

export default BackButton;

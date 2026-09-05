import { useEffect, useState } from "react";
import "../App.css";

const IntroScreen = ({ children }) => {
  const [introVisible, setIntroVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setIntroVisible(false), 1800);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#F4EEE0]">
      <div
        className={`pointer-events-none fixed inset-0 z-50 grid place-items-center bg-[#1E3B32] ${
          introVisible
            ? "animate-[intro-exit_700ms_1.05s_cubic-bezier(0.76,0,0.24,1)_forwards]"
            : "hidden"
        }`}
        aria-hidden={!introVisible}
      >
        <p className="m-0 font-serif text-[clamp(2.75rem,8vw,5.5rem)] font-semibold tracking-[-0.03em] text-[#F4EEE0] animate-[wordmark-enter_900ms_cubic-bezier(0.22,1,0.36,1)_both]">
          Shop<span className="text-[#D6A83B]">Ease</span>
        </p>
      </div>
      <div className="animate-[page-rise_850ms_1.15s_cubic-bezier(0.22,1,0.36,1)_both]">
        {children}
      </div>
    </div>
  );
};

export default IntroScreen;

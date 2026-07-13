import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, X, ChevronRight, ChevronLeft, HelpCircle } from "lucide-react";

interface Step {
  targetId: string;
  title: string;
  content: string;
  placement: "top" | "bottom" | "left" | "right";
  requiredTab?: string;
}

interface OnboardingTourProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: "light" | "dark";
}

const TOUR_STEPS: Step[] = [
  {
    targetId: "tour-sidebar-nav",
    title: "Menu Navigasi Utama",
    content: "Kelola seluruh aspek bisnis dari menu ini. Anda dapat beralih antara Ikhtisar Bisnis, Manajemen Inventaris, Arsip Penjualan, Laporan Otomatis, dan Akses & Peran (RBAC) secara instan.",
    placement: "right"
  },
  {
    targetId: "tour-theme-toggle",
    title: "Gaya Tampilan Fleksibel",
    content: "Beralih antara Mode Terang dan Mode Gelap kapan saja untuk menyesuaikan kenyamanan mata Anda selama bekerja.",
    placement: "bottom"
  },
  {
    targetId: "tour-chart-fluctuations",
    title: "Grafik Fluktuasi Stok",
    content: "Pantau tren naik-turun volume inventaris Anda selama 30 hari terakhir. Level stok berfluktuasi secara dinamis saat transaksi penjualan terjadi.",
    placement: "top",
    requiredTab: "overview"
  },
  {
    targetId: "tour-csv-import",
    title: "Impor CSV (Bulk)",
    content: "Ingin mengupdate stok atau menambah menu dalam jumlah banyak sekaligus? Gunakan fitur Impor CSV untuk mengunggah file spreadsheet secara massal.",
    placement: "left",
    requiredTab: "inventory"
  },
  {
    targetId: "tour-snapshot",
    title: "Database Safety Snapshots",
    content: "Amankan data Anda sebelum melakukan perubahan besar dengan membuat salinan cadangan (snapshot) ke Firestore, dan pulihkan kapan saja dengan satu klik.",
    placement: "top",
    requiredTab: "inventory"
  }
];

export function OnboardingTour({ activeTab, setActiveTab, theme }: OnboardingTourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Check first login
  useEffect(() => {
    const isCompleted = localStorage.getItem("topota_admin_tour_completed");
    if (!isCompleted) {
      // Trigger tour with minor delay to ensure DOM is fully painted
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Update coords when step or activeTab changes
  useEffect(() => {
    if (!isOpen) {
      setCoords(null);
      return;
    }

    const step = TOUR_STEPS[currentStep];

    // If step requires a specific tab, switch to it and wait for DOM updates
    if (step.requiredTab && activeTab !== step.requiredTab) {
      setIsTransitioning(true);
      setActiveTab(step.requiredTab);
      // Let layout stabilize
      const timer = setTimeout(() => {
        updateCoords();
        setIsTransitioning(false);
      }, 350);
      return () => clearTimeout(timer);
    }

    updateCoords();
  }, [currentStep, isOpen, activeTab]);

  // Set up resize and scroll listener to update position
  useEffect(() => {
    if (!isOpen) return;

    window.addEventListener("resize", updateCoords, { passive: true });
    window.addEventListener("scroll", updateCoords, { passive: true });

    const currentTargetId = TOUR_STEPS[currentStep]?.targetId;
    const targetElement = document.getElementById(currentTargetId);
    
    if (targetElement) {
      resizeObserverRef.current = new ResizeObserver(() => {
        updateCoords();
      });
      resizeObserverRef.current.observe(targetElement);
    }

    return () => {
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [isOpen, currentStep]);

  const updateCoords = () => {
    const step = TOUR_STEPS[currentStep];
    if (!step) return;

    const element = document.getElementById(step.targetId);
    if (element) {
      const rect = element.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
    } else {
      // Fallback to center of screen if element is not found
      setCoords({
        top: window.innerHeight / 2 - 50,
        left: window.innerWidth / 2 - 50,
        width: 100,
        height: 100
      });
    }
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setIsOpen(false);
    localStorage.setItem("topota_admin_tour_completed", "true");
  };

  const handleRestartTour = () => {
    setCurrentStep(0);
    setIsOpen(true);
  };

  if (!isOpen && !localStorage.getItem("topota_admin_tour_completed")) {
    return null;
  }

  const step = TOUR_STEPS[currentStep];

  // Calculate dynamic placement for tooltip style
  const getTooltipStyle = () => {
    if (!coords) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    
    const gap = 16;
    const tooltipWidth = 340;
    const tooltipHeight = 200;

    switch (step.placement) {
      case "right":
        return {
          top: Math.max(16, Math.min(window.innerHeight - tooltipHeight - 16, coords.top + coords.height / 2 - tooltipHeight / 2)),
          left: coords.left + coords.width + gap,
        };
      case "left":
        return {
          top: Math.max(16, Math.min(window.innerHeight - tooltipHeight - 16, coords.top + coords.height / 2 - tooltipHeight / 2)),
          left: Math.max(16, coords.left - tooltipWidth - gap),
        };
      case "bottom":
        return {
          top: coords.top + coords.height + gap,
          left: Math.max(16, Math.min(window.innerWidth - tooltipWidth - 16, coords.left + coords.width / 2 - tooltipWidth / 2)),
        };
      case "top":
      default:
        return {
          top: Math.max(16, coords.top - tooltipHeight - gap),
          left: Math.max(16, Math.min(window.innerWidth - tooltipWidth - 16, coords.left + coords.width / 2 - tooltipWidth / 2)),
        };
    }
  };

  return (
    <>
      {/* Floating help trigger so users can restart tour at any point */}
      {!isOpen && (
        <button
          onClick={handleRestartTour}
          title="Mulai Panduan Tur Dashboard"
          className="fixed bottom-6 right-6 p-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full shadow-lg border border-neutral-800 transition z-40 flex items-center gap-1.5 text-xs font-semibold"
        >
          <HelpCircle className="w-5 h-5 text-emerald-400" />
          <span>Panduan Tur</span>
        </button>
      )}

      <AnimatePresence>
        {isOpen && coords && (
          <div className="fixed inset-0 z-[9999] overflow-hidden select-none">
            
            {/* Dark Mask Layer using SVG for perfect visual cut-out */}
            <svg className="fixed inset-0 w-full h-full pointer-events-none">
              <defs>
                <mask id="tour-spotlight-mask">
                  <rect width="100%" height="100%" fill="white" />
                  <rect
                    x={coords.left - 6}
                    y={coords.top - 6}
                    width={coords.width + 12}
                    height={coords.height + 12}
                    rx={12}
                    ry={12}
                    fill="black"
                  />
                </mask>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill="rgba(10, 10, 10, 0.65)"
                mask="url(#tour-spotlight-mask)"
                className="pointer-events-auto cursor-default"
              />
            </svg>

            {/* Glowing animated visual frame around target element */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{
                opacity: 1,
                scale: 1,
                x: coords.left - 6,
                y: coords.top - 6,
                width: coords.width + 12,
                height: coords.height + 12,
              }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              className="fixed pointer-events-none border-2 border-emerald-500 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.55)]"
            />

            {/* Tooltip Box Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              style={getTooltipStyle()}
              className={`fixed w-[340px] rounded-3xl shadow-2xl p-6 border flex flex-col z-[10001] pointer-events-auto ${
                theme === "dark" 
                  ? "bg-neutral-900 border-neutral-800 text-stone-100" 
                  : "bg-white border-neutral-200 text-neutral-900"
              }`}
            >
              {/* Header with Step Counter */}
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5" />
                  Langkah {currentStep + 1} dari {TOUR_STEPS.length}
                </span>
                <button
                  onClick={handleSkip}
                  className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Step Title & Description */}
              <div className="space-y-1.5 flex-1 select-text">
                <h4 className="font-serif text-base font-bold tracking-tight">
                  {step.title}
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {isTransitioning ? "Memuat halaman terkait..." : step.content}
                </p>
              </div>

              {/* Action Controller buttons */}
              <div className="flex items-center justify-between pt-5 border-t border-neutral-100 dark:border-neutral-800/80 mt-4">
                <button
                  onClick={handleSkip}
                  className="text-xs font-semibold text-neutral-400 hover:text-neutral-600 dark:hover:text-stone-300 transition"
                >
                  Lewati Tur
                </button>

                <div className="flex items-center gap-2">
                  {currentStep > 0 && (
                    <button
                      onClick={handlePrev}
                      className="p-2 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-stone-300 transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={handleNext}
                    className="flex items-center gap-1.5 px-4.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    <span>{currentStep === TOUR_STEPS.length - 1 ? "Selesai" : "Lanjut"}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>

          </div>
        )}
      </AnimatePresence>
    </>
  );
}

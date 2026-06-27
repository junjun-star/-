/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Monitor, Cpu, Palette as PaletteIcon, HelpCircle, Laptop, Home, Activity, Package, Settings, Info, RefreshCw } from "lucide-react";
import { SlideQueueItem, Palette } from "./types";
import ThzCalculator from "./components/ThzCalculator";
import WindowsPackerGuide from "./components/WindowsPackerGuide";

const PALETTES: Palette[] = [
  {
    name: "Classic Indigo",
    primary: "#4f46e5", // Indigo 600
    accent: "#ef4444",
    blob1: "#818cf8",
    blob2: "#a5b4fc",
    blob3: "#fb7185",
    blob4: "#fecdd3"
  },
  {
    name: "Emerald Green",
    primary: "#059669", // Emerald 600
    accent: "#d97706",
    blob1: "#34d399",
    blob2: "#6ee7b7",
    blob3: "#fbbf24",
    blob4: "#fef3c7"
  },
  {
    name: "Crimson Red",
    primary: "#dc2626", // Red 600
    accent: "#2563eb",
    blob1: "#f87171",
    blob2: "#fca5a5",
    blob3: "#60a5fa",
    blob4: "#dbeafe"
  },
  {
    name: "Deep Ocean Blue",
    primary: "#0284c7", // Sky 600
    accent: "#f59e0b",
    blob1: "#38bdf8",
    blob2: "#7dd3fc",
    blob3: "#fbbf24",
    blob4: "#fef3c7"
  },
  {
    name: "Dark Amethyst",
    primary: "#7c3aed", // Violet 600
    accent: "#10b981",
    blob1: "#a78bfa",
    blob2: "#c4b5fd",
    blob3: "#34d399",
    blob4: "#d1fae5"
  }
];

export default function App() {
  const [activeView, setActiveView] = useState<"home" | "calculator" | "packer">("home");
  const [paletteIdx, setPaletteIdx] = useState<number>(0);
  const [slideQueue, setSlideQueue] = useState<SlideQueueItem[]>([]);
  const [currentTime, setCurrentTime] = useState("");

  // Real-time clock for bottom status bar
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const localStr = d.toLocaleTimeString("zh-CN", { hour12: false });
      const utcStr = d.toISOString().slice(11, 19);
      setCurrentTime(`LOCAL ${localStr} | UTC ${utcStr}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Custom toast notification states
  const [toast, setToast] = useState<{
    show: boolean;
    msg: string;
    type: "success" | "error" | "info";
  }>({
    show: false,
    msg: "",
    type: "info"
  });

  const activePalette = PALETTES[paletteIdx];

  const cyclePalette = () => {
    setPaletteIdx((prev) => (prev + 1) % PALETTES.length);
  };

  const showToastMsg = (msg: string, type: "success" | "error" | "info" = "info") => {
    setToast({ show: true, msg, type });
  };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const appStyle = {
    "--primary": activePalette.primary,
    "--accent": activePalette.accent,
  } as React.CSSProperties;

  return (
    <div className="flex flex-col h-screen overflow-hidden text-slate-800 bg-[#f8fafc] font-sans antialiased" style={appStyle}>
      
      {/* ================== TOP TITLE BAR (WINDOWS AESTHETIC) ================== */}
      <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 select-none flex-shrink-0">
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm transition-colors duration-300"
            style={{ backgroundColor: activePalette.primary }}
          >
            📡
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-extrabold text-slate-800 tracking-tight uppercase">万能实验工具箱</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest font-mono">THz Pro Parameter Controller v2.5</span>
          </div>
        </div>
        
        {/* Decorative Windows Window Controls */}
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-slate-200 hover:bg-slate-300 transition-colors cursor-pointer"></span>
          <span className="w-3 h-3 rounded-full bg-slate-200 hover:bg-slate-300 transition-colors cursor-pointer"></span>
          <span className="w-3 h-3 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition-colors cursor-pointer flex items-center justify-center text-[8px] font-bold">×</span>
        </div>
      </div>

      {/* ================== MAIN SHELL (SIDEBAR + MAIN CONTENT) ================== */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* SIDEBAR NAVIGATION */}
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-5 select-none flex-shrink-0">
          <div className="space-y-6">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-4 font-mono">导航菜单 / NAVIGATION</div>
              <nav className="space-y-1">
                
                {/* Home Page Link */}
                <button
                  onClick={() => setActiveView("home")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                    activeView === "home"
                      ? "bg-slate-50 text-slate-900 border-l-4 border-slate-800"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                  style={activeView === "home" ? { borderLeftColor: activePalette.primary, color: activePalette.primary } : {}}
                >
                  <Home className="w-4 h-4 flex-shrink-0" />
                  <span>工具箱首页 Dashboard</span>
                </button>

                {/* THz Calculator Link */}
                <button
                  onClick={() => setActiveView("calculator")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                    activeView === "calculator"
                      ? "bg-slate-50 text-slate-900 border-l-4 border-slate-800"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                  style={activeView === "calculator" ? { borderLeftColor: activePalette.primary, color: activePalette.primary } : {}}
                >
                  <Activity className="w-4 h-4 flex-shrink-0" />
                  <span>太赫兹器件计算 THz Calc</span>
                </button>

                {/* Windows Packer Guide Link */}
                <button
                  onClick={() => setActiveView("packer")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                    activeView === "packer"
                      ? "bg-slate-50 text-slate-900 border-l-4 border-slate-800"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                  style={activeView === "packer" ? { borderLeftColor: activePalette.primary, color: activePalette.primary } : {}}
                >
                  <Package className="w-4 h-4 flex-shrink-0" />
                  <span>客户端打包向导 Packer</span>
                </button>

              </nav>
            </div>

            {/* Live Queue status sidebar widget */}
            {slideQueue.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600">PPT 幻灯片队列</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-200 text-slate-700">{slideQueue.length} 页</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(100, slideQueue.length * 20)}%`,
                      backgroundColor: activePalette.primary
                    }}
                  ></div>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
                  已编译绑定多组测试光谱插图，可随时完成 PowerPoint 打包导出。
                </p>
              </div>
            )}
          </div>

          {/* Theme switching in sidebar footer */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold font-mono">主题风格 / THEME HIGHLIGHT</div>
            <button
              onClick={cyclePalette}
              className="w-full flex items-center justify-between px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-[11px] font-bold text-slate-700 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activePalette.primary }}></span>
                <span>{activePalette.name}</span>
              </div>
              <span className="text-[10px] text-slate-400">切换 ↻</span>
            </button>
          </div>
        </div>

        {/* MAIN DISPLAY AREA */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#f8fafc]">
          <div className="max-w-5xl mx-auto">
            
            {/* ================== HOME VIEW ================== */}
            {activeView === "home" && (
              <div className="space-y-10 py-6">
                <header className="space-y-2 border-b border-slate-200 pb-6">
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
                    📡 万能实验工具箱 / Engineering Sandbox
                  </h1>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
                    集成了极速太赫兹参数计算引擎和原生打包工具。本端采用纯前端沙盒技术，所有数学解析、图片装箱以及幻灯片构建逻辑皆在本地运行，零服务器通信，绝对保障您的核心学术和商业数据安全。
                  </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Tile 1: THz Calculator */}
                  <button
                    onClick={() => setActiveView("calculator")}
                    className="flex flex-col items-start text-left p-6 bg-white border border-slate-200 shadow-sm rounded-xl hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div 
                      className="text-2xl mb-4 p-3 rounded-lg text-white font-bold shadow-sm transition-colors"
                      style={{ backgroundColor: activePalette.primary }}
                    >
                      📡
                    </div>
                    <h3 className="text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">太赫兹器件关键参数的计算</h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      导入光谱透射率 Excel 数据，自动计算全频段调制深度、调节区间、调制范围及插入损耗。支持绑定测试曲线插图，多层合并打包下载并渲染生成完美的 16:9 报告 PPTX。
                    </p>
                  </button>

                  {/* Tile 2: Windows Packager Guide */}
                  <button
                    onClick={() => setActiveView("packer")}
                    className="flex flex-col items-start text-left p-6 bg-white border border-slate-200 shadow-sm rounded-xl hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="text-2xl mb-4 p-3 bg-slate-800 text-white rounded-lg font-bold shadow-sm">
                      💻
                    </div>
                    <h3 className="text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">Windows 客户端打包向导</h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      完整提供如何将本系统直接移植至 Windows 系统，并打包成无需浏览器启动的双击免安装绿色 .exe 应用程序的详细配置与运行命令（代码中已预置所有脚本）。
                    </p>
                  </button>

                </div>

                {/* Additional professional info board */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Info className="w-3.5 h-3.5" /> 系統運行說明 / SYSTEM DIAGNOSTICS
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    本工作平台内置 SheetJS 表格核心组件与 PptxGenJS 演示文稿矢量发生器。所有的计算采用绝对透射率数值转换，能够完美识别常见的百分比形式（例如 1.5% - 85% 等范围）并智能过滤无效波长或空单元格，提供符合国际太赫兹学会标准报告的指标参数。
                  </p>
                </div>

                <footer className="text-center pt-6 text-xs text-slate-400 font-medium">
                  Z.ai · THz Engineering & Instrumentation Group · ALL DATA PERSISTED LOCALLY
                </footer>
              </div>
            )}

            {/* ================== CALCULATOR VIEW ================== */}
            {activeView === "calculator" && (
              <ThzCalculator
                onBack={() => setActiveView("home")}
                slideQueue={slideQueue}
                onAddToQueue={(item) => setSlideQueue((prev) => [...prev, item])}
                onClearQueue={() => setSlideQueue([])}
                onRemoveFromQueue={(index) => setSlideQueue((prev) => prev.filter((_, i) => i !== index))}
                showToast={showToastMsg}
              />
            )}

            {/* ================== WIN PACKER GUIDE VIEW ================== */}
            {activeView === "packer" && (
              <WindowsPackerGuide
                onBack={() => setActiveView("home")}
              />
            )}

          </div>
        </div>

      </div>

      {/* ================== BOTTOM SYSTEM STATUS BAR ================== */}
      <div className="h-6 bg-slate-900 text-slate-400 text-[10px] flex items-center justify-between px-6 font-mono select-none flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            STATUS: ONLINE
          </span>
          <span className="opacity-30">|</span>
          <span>ENGINE: LOCAL_SANDBOX_STABLE</span>
          <span className="opacity-30">|</span>
          <span>STORAGE: INTERNAL_MEM_ONLY</span>
        </div>
        <div className="flex items-center gap-4">
          <span>PORT: 3000</span>
          <span className="opacity-30">|</span>
          <span className="text-slate-300 font-bold">{currentTime}</span>
        </div>
      </div>

      {/* ================== TOAST NOTIFICATION ================== */}
      {toast.show && (
        <div 
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[10000] px-4 py-3 rounded-lg font-bold text-xs shadow-lg flex items-center gap-2.5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 bg-slate-900 text-white border border-slate-700"
        >
          <span style={{ color: activePalette.primary }}>
            {toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : "ℹ"}
          </span>
          <span className="font-mono">{toast.msg}</span>
        </div>
      )}

    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Laptop, 
  Terminal, 
  FolderDown, 
  Monitor, 
  Flame, 
  Compass, 
  HelpCircle,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
  Layers,
  FileCode
} from "lucide-react";

interface Step {
  title: string;
  description: string;
  badge: string;
}

export default function WindowsPackerGuide({ onBack }: { onBack: () => void }) {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pwa" | "electron">("pwa");

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const stepsPwa: Step[] = [
    {
      badge: "1",
      title: "使用 Edge 或 Chrome 浏览器打开本站",
      description: "在 Windows 系统中，推荐使用 Microsoft Edge 或 Google Chrome 浏览器访问当前在线应用。"
    },
    {
      badge: "2",
      title: "点击地址栏右侧的「安装」图标",
      description: "在地址栏最右侧，你会看到一个类似「小屏幕加加号」或「安装应用」的图标（快捷键：Alt + F 菜单中也会有“安装此站点为应用”选项）。"
    },
    {
      badge: "3",
      title: "确认安装并添加到桌面与任务栏",
      description: "在弹出的对话框中点击「安装」。你可以勾选「创建桌面快捷方式」、「固定到任务栏」或「开机启动」。"
    },
    {
      badge: "4",
      title: "享受纯净的独立窗口客户端",
      description: "安装后，应用将不再有浏览器的标签栏和地址栏，而是以一个干净、原生、带有独立图标的 Windows 客户端窗口运行，运行速度与本地客户端完全一致，且拥有完整的本地文件系统读写权限！"
    }
  ];

  const stepsElectron: Step[] = [
    {
      badge: "1",
      title: "导出并下载项目源代码",
      description: "在 AI Studio 网页右上角的设置菜单（Settings）中，选择「Export as ZIP」将整个工程打包下载到你的 Windows 电脑中，并解压到一个没有中文和空格的目录下（例如：D:\\thz-toolbox）。"
    },
    {
      badge: "2",
      title: "安装 Windows 环境依赖 Node.js",
      description: "前往 Node.js 官方网站 (nodejs.org) 下载并安装最新的 LTS (长期支持) 版本，安装时一路点击「Next」即可。"
    },
    {
      badge: "3",
      title: "打开终端并安装项目依赖包",
      description: "在解压目录下，按住 Shift + 鼠标右键，选择「在此处打开 PowerShell 窗口」或「在终端中打开」，运行安装命令。"
    },
    {
      badge: "4",
      title: "调试与一键打包成 .exe 绿色单文件",
      description: "安装完成后，你可以直接开启桌面端测试窗口。测试无误后，运行打包命令，系统会自动在 dist-electron/ 目录下生成一个免安装的独立运行 .exe 软件！"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Back bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="btn btn-secondary cursor-pointer"
        >
          ← 返回工具箱
        </button>
        <span className="queue-pill">
          <span className="pill-dot bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></span>
          <span>Windows 本地打包向导 v1.0</span>
        </span>
      </div>

      <header className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center justify-center gap-2">
          <Monitor className="text-blue-500 w-8 h-8" />
          Windows 客户端运行与打包指南
        </h1>
        <p className="text-sm text-gray-600 mt-2">
          无需复杂的客户端开发，简单几步即可将本系统转化为 Windows 桌面级运行软件
        </p>
      </header>

      {/* Tabs */}
      <div className="flex justify-center">
        <div className="bg-white/50 backdrop-blur-md p-1 rounded-xl border border-white/80 shadow-md inline-flex">
          <button
            onClick={() => setActiveTab("pwa")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "pwa"
                ? "bg-blue-500 text-white shadow-md"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/40"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            方法一：PWA 快捷安装 (推荐，零门槛)
          </button>
          <button
            onClick={() => setActiveTab("electron")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "electron"
                ? "bg-purple-500 text-white shadow-md"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/40"
            }`}
          >
            <Terminal className="w-4 h-4" />
            方法二：Electron 独立打包 (.exe 纯本地包)
          </button>
        </div>
      </div>

      {/* Method 1: PWA */}
      {activeTab === "pwa" && (
        <div className="space-y-6">
          <div className="glass p-6 md:p-8 rounded-3xl space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-2xl text-blue-600">
                <Laptop className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">什么是 PWA (渐进式 Web 应用)？</h3>
                <p className="text-sm text-gray-600 mt-1">
                  PWA 是微软与谷歌极力推崇的新一代 Windows 软件形态。它无需庞大的安装包，在保留网页极速运行特性的同时，将其深度融合到 Windows 系统中，在任务栏、开始菜单、控制面板中拥有独立的入口和完全隔离的运行沙盒。
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200/50 pt-6">
              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Compass className="text-blue-500 w-4 h-4" />
                安装步骤
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stepsPwa.map((s, i) => (
                  <div key={i} className="bg-white/40 border border-white/60 p-5 rounded-2xl relative hover:translate-y-[-2px] transition-all group shadow-sm">
                    <span className="absolute top-4 right-4 text-3xl font-black text-blue-500/10 group-hover:text-blue-500/20 transition-all">
                      {s.badge}
                    </span>
                    <h5 className="font-bold text-gray-900 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold inline-flex items-center justify-center shadow-[0_2px_6px_rgba(59,130,246,0.3)]">
                        {s.badge}
                      </span>
                      {s.title}
                    </h5>
                    <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                      {s.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-200/50 p-4 rounded-xl text-xs text-blue-800 leading-relaxed flex items-start gap-3">
              <HelpCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
              <div>
                <b className="font-bold">本地运行优势：</b>
                本系统的所有表格数据提取（SheetJS）和 PowerPoint 文件生成（PptxGenJS）都在浏览器端运行。PWA 安装形式不仅没有任何网络延迟，而且对隐私数据非常友好（数据不出本机，保证学术及项目数据绝对机密）。
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Method 2: Electron */}
      {activeTab === "electron" && (
        <div className="space-y-6">
          <div className="glass p-6 md:p-8 rounded-3xl space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 rounded-2xl text-purple-600">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">什么是 Electron 本地打包？</h3>
                <p className="text-sm text-gray-600 mt-1">
                  如果你需要交付一个不依赖浏览器的物理文件（如双击直接运行的 <span className="font-semibold text-purple-700">.exe 应用程序</span>），或者需要在完全离线的极特殊环境里工作。我们在项目中已经为你完成了完整的 Electron 配置文件和打包脚本！只需下载代码在本地执行打包命令即可。
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200/50 pt-6">
              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Terminal className="text-purple-500 w-4 h-4" />
                打包具体步骤
              </h4>
              <div className="space-y-4">
                {stepsElectron.map((s, i) => (
                  <div key={i} className="bg-white/40 border border-white/60 p-5 rounded-2xl relative shadow-sm flex flex-col md:flex-row gap-4 items-start">
                    <span className="w-8 h-8 rounded-full bg-purple-500 text-white text-sm font-bold inline-flex items-center justify-center shadow-[0_3px_8px_rgba(168,85,247,0.3)] flex-shrink-0">
                      {s.badge}
                    </span>
                    <div className="space-y-2 flex-1">
                      <h5 className="font-bold text-gray-900 text-base">{s.title}</h5>
                      <p className="text-xs text-gray-600 leading-relaxed">{s.description}</p>
                      
                      {/* Sub-components for terminal codes based on steps */}
                      {i === 2 && (
                        <div className="relative mt-3">
                          <pre className="bg-gray-900 text-purple-300 p-3 rounded-lg text-xs font-mono overflow-x-auto select-all shadow-inner">
                            {`# 1. 安装项目的所有基础依赖（包含 Excel / PPT 处理核心）\nnpm install\n\n# 2. 安装 Electron 打包所需的专用工具\nnpm install --save-dev electron electron-builder`}
                          </pre>
                          <button
                            onClick={() => copyToClipboard(`npm install\nnpm install --save-dev electron electron-builder`, "deps")}
                            className="absolute top-2 right-2 p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded cursor-pointer transition-colors"
                            title="复制命令"
                          >
                            {copiedText === "deps" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}

                      {i === 3 && (
                        <div className="space-y-2 mt-3">
                          <div className="relative">
                            <div className="text-[11px] text-gray-500 font-semibold mb-1">测试运行桌面端：</div>
                            <pre className="bg-gray-900 text-purple-300 p-3 rounded-lg text-xs font-mono overflow-x-auto shadow-inner">
                              {`npm run electron:start`}
                            </pre>
                            <button
                              onClick={() => copyToClipboard(`npm run electron:start`, "run")}
                              className="absolute top-6 right-2 p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded cursor-pointer transition-colors"
                              title="复制命令"
                            >
                              {copiedText === "run" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          
                          <div className="relative">
                            <div className="text-[11px] text-gray-500 font-semibold mb-1">构建生成 .exe 文件：</div>
                            <pre className="bg-gray-900 text-purple-300 p-3 rounded-lg text-xs font-mono overflow-x-auto shadow-inner">
                              {`npm run electron:build`}
                            </pre>
                            <button
                              onClick={() => copyToClipboard(`npm run electron:build`, "build")}
                              className="absolute top-6 right-2 p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded cursor-pointer transition-colors"
                              title="复制命令"
                            >
                              {copiedText === "build" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Config file explorer visual for transparency */}
            <div className="bg-white/50 border border-white/80 p-5 rounded-2xl shadow-sm space-y-3">
              <h5 className="font-bold text-gray-800 text-xs flex items-center gap-2">
                <FileCode className="text-purple-600 w-4 h-4" />
                已预置的打包配置文件列表 (无需修改)
              </h5>
              <div className="text-xs text-gray-600 leading-relaxed grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                  <span className="font-bold text-purple-800 block">/package.json</span>
                  已经配置好打包格式、输出路径（dist-electron/）、应用程序名和 Windows 平台配置。
                </div>
                <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                  <span className="font-bold text-purple-800 block">/main-electron.cjs</span>
                  主运行进程文件。设置窗口宽高、禁用菜单栏、自动加载 Vite 编译后的本地网页。
                </div>
              </div>
            </div>

            <div className="bg-purple-50/50 border border-purple-200/50 p-4 rounded-xl text-xs text-purple-800 leading-relaxed flex items-start gap-3">
              <Flame className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-600 animate-pulse" />
              <div>
                <b className="font-bold">极速极简包：</b>
                打包配置默认设置为 <b className="font-extrabold text-purple-900">"portable"</b>。这意味着打包后产生的是一个<b>绿色单文件版 .exe 软件</b>。无需安装，直接拷贝到 U 盘在任何 Windows 电脑上双击即可直接打开使用！
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

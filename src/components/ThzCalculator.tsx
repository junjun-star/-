/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import pptxgen from "pptxgenjs";
import { 
  FileSpreadsheet, 
  Image as ImageIcon, 
  Settings, 
  Download, 
  Plus, 
  Presentation, 
  RefreshCw,
  HelpCircle,
  TrendingUp,
  Sliders,
  Maximize2,
  Trash2,
  SlidersHorizontal
} from "lucide-react";
import { SlideQueueItem, ParsedRow } from "../types";

interface ThzCalculatorProps {
  onBack: () => void;
  slideQueue: SlideQueueItem[];
  onAddToQueue: (item: SlideQueueItem) => void;
  onClearQueue: () => void;
  onRemoveFromQueue: (index: number) => void;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function ThzCalculator({
  onBack,
  slideQueue,
  onAddToQueue,
  onClearQueue,
  onRemoveFromQueue,
  showToast
}: ThzCalculatorProps) {
  // --- States ---
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<ParsedRow[]>([]);
  const [sheetName, setSheetName] = useState<string>("");

  // Column mapping states
  const [freqIdx, setFreqIdx] = useState<number>(0);
  const [tmaxIdx, setTmaxIdx] = useState<number>(1);
  const [tminIdx, setTminIdx] = useState<number>(2);
  const [mdColName, setMdColName] = useState<string>("Modulation Depth (%)");

  // Image states
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>("");

  // Step visibility and UI states
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Excel upload, 2: Image upload, 3: Column mapping, 4: Results
  const [resultData, setResultData] = useState<any[][]>([]);
  const [resultHeaders, setResultHeaders] = useState<string[]>([]);
  
  // Statistical results state
  const [stats, setStats] = useState({
    count: 0,
    mean: 0,
    median: 0,
    std: 0,
    min: 0,
    minFreq: 0,
    max: 0,
    maxFreq: 0,
    freqRangeStr: "—"
  });

  // Highlight metrics
  const [metrics, setMetrics] = useState({
    avgMd: 0,
    adjRange: 0,
    modRange: 0,
    ilValue: 0,
    tmaxMean: 0,
    tminMean: 0,
    tmaxMax: 0,
    tminMin: 0,
    tmaxAbs: 0,
    detectNote: "",
    tmaxFreq: 0,
    tminFreq: 0
  });

  // Modal states for save location / filename custom dialog
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [saveFilename, setSaveFilename] = useState<string>("太赫兹器件参数综合分析.pptx");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // --- Refs ---
  const excelInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const dropZoneExcelRef = useRef<HTMLDivElement>(null);
  const dropZoneImageRef = useRef<HTMLDivElement>(null);

  // Helper helper to format floats
  const fmt = (v: number | null | undefined, d = 4) => 
    (v === null || v === undefined || !isFinite(v)) ? "—" : v.toFixed(d);

  const toNum = (v: any): number | null => {
    if (v === null || v === undefined || v === "") return null;
    if (typeof v === "number") return isFinite(v) ? v : null;
    const n = parseFloat(String(v).replace(/[,%\s]/g, ""));
    return isFinite(n) ? n : null;
  };

  // --- Drag and Drop Handlers for Excel ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === dropZoneExcelRef.current) {
      dropZoneExcelRef.current?.classList.add("border-blue-500", "bg-blue-500/10");
    } else if (e.currentTarget === dropZoneImageRef.current) {
      dropZoneImageRef.current?.classList.add("border-purple-500", "bg-purple-500/10");
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === dropZoneExcelRef.current) {
      dropZoneExcelRef.current?.classList.remove("border-blue-500", "bg-blue-500/10");
    } else if (e.currentTarget === dropZoneImageRef.current) {
      dropZoneImageRef.current?.classList.remove("border-purple-500", "bg-purple-500/10");
    }
  };

  const handleDropExcel = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneExcelRef.current?.classList.remove("border-blue-500", "bg-blue-500/10");
    const file = e.dataTransfer.files[0];
    if (file) handleExcelFile(file);
  };

  const handleDropImage = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneImageRef.current?.classList.remove("border-purple-500", "bg-purple-500/10");
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleImageFile(file);
  };

  // --- File Parsing Logic ---
  const handleExcelFile = (file: File) => {
    setExcelFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        if (!wb.SheetNames.length) {
          showToast("Excel 文件中无工作表", "error");
          return;
        }
        const sName = wb.SheetNames[0];
        setSheetName(sName);
        const ws = wb.Sheets[sName];
        
        // header: 1 reads sheet as array of arrays
        const aoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, blankrows: false });
        if (!aoa.length) {
          showToast("工作表内容为空", "error");
          return;
        }

        const firstRow = aoa[0];
        const parsedHeaders = firstRow.map((h, i) => {
          if (h === null || h === undefined || String(h).trim() === "") {
            return `Column_${i + 1}`;
          }
          return String(h);
        });

        const dataRows = aoa.slice(1).filter(r => r.some(c => c !== null && c !== undefined && String(c).trim() !== ""));

        setHeaders(parsedHeaders);
        setRawData(dataRows);

        // Autofit indices
        const fIdx = 0;
        let tmaxI = parsedHeaders.findIndex(h => /N_1\.5/i.test(h));
        let tminI = parsedHeaders.findIndex(h => /P_1\.5/i.test(h));
        if (tmaxI < 0) tmaxI = parsedHeaders.length > 1 ? 1 : 0;
        if (tminI < 0) tminI = parsedHeaders.length > 2 ? 2 : 0;

        setFreqIdx(fIdx);
        setTmaxIdx(tmaxI);
        setTminIdx(tminI);

        showToast("Excel 数据解析成功！", "success");
        setStep(2); // Go to step 2: image upload
      } catch (err: any) {
        showToast("文件解析失败: " + err.message, "error");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("请选择有效的图片文件", "error");
      return;
    }
    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageDataUrl(e.target?.result as string);
      showToast("插图导入成功", "success");
    };
    reader.readAsDataURL(file);
  };

  // --- Calculations ---
  const handleCalculate = () => {
    if (!excelFile || !rawData.length) {
      showToast("请先导入 Excel 数据", "error");
      return;
    }
    if (!imageDataUrl) {
      showToast("请先在步骤 2 中导入对应的参考数据图", "error");
      setStep(2);
      return;
    }
    if (tmaxIdx === tminIdx) {
      showToast("Tmax 列和 Tmin 列不能相同", "error");
      return;
    }

    // Build headers with MD
    const rHeaders = [...headers];
    let mdH = mdColName.trim() || "Modulation Depth (%)";
    let k = 2;
    while (rHeaders.includes(mdH)) {
      mdH = `${mdColName} (${k++})`;
    }
    rHeaders.push(mdH);
    setResultHeaders(rHeaders);

    const mdValues: number[] = [];
    const rData = rawData.map((row) => {
      const padded = [...row];
      // Pad empty cells if row length is shorter than headers
      while (padded.length < headers.length) {
        padded.push(null);
      }
      const tmax = toNum(row[tmaxIdx]);
      const tmin = toNum(row[tminIdx]);

      // MD = (Tmax - Tmin) / Tmax * 100
      let md: number | null = null;
      if (tmax !== null && tmin !== null && tmax !== 0) {
        md = ((tmax - tmin) / tmax) * 100;
        mdValues.push(md);
      }
      padded.push(md);
      return padded;
    });

    setResultData(rData);

    // Compute statistics
    const xs = mdValues.filter(v => v !== null && isFinite(v));
    const count = xs.length;
    let mean = 0, median = 0, std = 0, minVal = 0, maxVal = 0;
    let minFreq = 0, maxFreq = 0;

    const freqs = rData.map(r => toNum(r[freqIdx])).filter(v => v !== null) as number[];
    let freqRangeStr = "—";
    if (freqs.length) {
      const fmin = Math.min(...freqs);
      const fmax = Math.max(...freqs);
      freqRangeStr = `${fmin.toFixed(4)} – ${fmax.toFixed(4)} THz`;
    }

    if (count > 0) {
      const sum = xs.reduce((a, b) => a + b, 0);
      mean = sum / count;
      const sorted = [...xs].sort((a, b) => a - b);
      median = count % 2 ? sorted[(count - 1) / 2] : (sorted[count / 2 - 1] + sorted[count / 2]) / 2;
      const variance = xs.reduce((a, b) => a + (b - mean) ** 2, 0) / count;
      std = Math.sqrt(variance);
      minVal = sorted[0];
      maxVal = sorted[count - 1];

      // Find freqs for min/max MD
      let minRowIdx = -1, maxRowIdx = -1;
      for (let i = 0; i < rData.length; i++) {
        const mdVal = rData[i][headers.length]; // md value is appended at headers.length index
        if (mdVal === minVal) minRowIdx = i;
        if (mdVal === maxVal) maxRowIdx = i;
      }
      if (minRowIdx >= 0) minFreq = toNum(rData[minRowIdx][freqIdx]) || 0;
      if (maxRowIdx >= 0) maxFreq = toNum(rData[maxRowIdx][freqIdx]) || 0;
    }

    setStats({
      count,
      mean,
      median,
      std,
      min: minVal,
      minFreq,
      max: maxVal,
      maxFreq,
      freqRangeStr
    });

    // Compute metric cards (平均调制深度, 调节区间, 调制范围, 插入损耗 IL)
    const tmaxAll = rData.map(r => toNum(r[tmaxIdx])).filter(v => v !== null) as number[];
    const tminAll = rData.map(r => toNum(r[tminIdx])).filter(v => v !== null) as number[];
    const tmaxMean = tmaxAll.length ? tmaxAll.reduce((a, b) => a + b, 0) / tmaxAll.length : 0;
    const tminMean = tminAll.length ? tminAll.reduce((a, b) => a + b, 0) / tminAll.length : 0;
    const adjRange = tmaxMean - tminMean;
    const avgMd = tmaxMean !== 0 ? (tmaxMean - tminMean) / tmaxMean * 100 : 0;

    const tmaxMax = tmaxAll.length ? Math.max(...tmaxAll) : 0;
    const tminMin = tminAll.length ? Math.min(...tminAll) : 0;
    const modRange = tmaxMax - tminMin;

    let ilValue = 0;
    let tmaxAbs = 0;
    let detectNote = "";
    if (tmaxMax > 0) {
      if (tmaxMax > 1) {
        tmaxAbs = tmaxMax / 100;
        detectNote = `数据为百分比形式 (${tmaxMax.toFixed(4)}%)，已自动转换为绝对透射率 ${tmaxAbs.toFixed(6)}`;
      } else {
        tmaxAbs = tmaxMax;
        detectNote = `数据已是绝对透射率形式 (${tmaxMax.toFixed(6)})`;
      }
      ilValue = -10 * Math.log10(tmaxAbs);
    }

    // Find frequencies of tmaxMax and tminMin
    let tmaxMaxRowIdx = rData.findIndex(r => toNum(r[tmaxIdx]) === tmaxMax);
    let tminMinRowIdx = rData.findIndex(r => toNum(r[tminIdx]) === tminMin);
    const tmaxFreq = tmaxMaxRowIdx >= 0 ? toNum(rData[tmaxMaxRowIdx][freqIdx]) || 0 : 0;
    const tminFreq = tminMinRowIdx >= 0 ? toNum(rData[tminMinRowIdx][freqIdx]) || 0 : 0;

    setMetrics({
      avgMd,
      adjRange,
      modRange,
      ilValue,
      tmaxMean,
      tminMean,
      tmaxMax,
      tminMin,
      tmaxAbs,
      detectNote,
      tmaxFreq,
      tminFreq
    });

    // Enqueue this slide automatically
    const sourceFileName = excelFile.name.replace(/\.(xlsx|xls|csv)$/i, "");
    onAddToQueue({
      image: imageDataUrl,
      imageFileName: imageFileName || "image.png",
      sourceFileName,
      metrics: {
        avgMd,
        adjRange,
        modRange,
        ilValue,
        tmaxName: headers[tmaxIdx],
        tminName: headers[tminIdx]
      }
    });

    setStep(4); // View results
    showToast("计算完成！已生成本组统计数据，并成功加入幻灯片生成队列。", "success");
  };

  // --- Export Excel ---
  const downloadExcel = async () => {
    if (!resultData.length) return;

    const aoa = [resultHeaders].concat(
      resultData.map(row => row.map(v => v === null ? "" : v))
    );
    const ws = XLSX.utils.aoa_to_sheet(aoa);

    const mdColIdx = resultHeaders.length - 1;
    const mdColLetter = XLSX.utils.encode_col(mdColIdx);
    ws["!cols"] = resultHeaders.map(h => ({ wch: Math.max(12, String(h).length + 2) }));
    
    // Set 4-decimal format
    for (let r = 1; r <= resultData.length; r++) {
      const addr = mdColLetter + (r + 1);
      if (ws[addr] && typeof ws[addr].v === "number") {
        ws[addr].z = "0.0000";
      }
    }
    
    // Sheet 2: Stats Summary sheet
    const statAoa = [
      ["太赫兹器件参数 (THz Device Parameters) 统计"],
      [],
      ["公式", "MD(f) = (Tmax - Tmin) / Tmax × 100%"],
      ["Tmax 列", headers[tmaxIdx]],
      ["Tmin 列", headers[tminIdx]],
      [],
      ["一、调制深度 MD 统计", "", ""],
      ["统计量", "数值", "说明"],
      ["数据点总数", stats.count, "全频段有效数据点"],
      ["MD 均值 (%)", +stats.mean.toFixed(4)],
      ["MD 中位数 (%)", +stats.median.toFixed(4)],
      ["MD 标准差 (%)", +stats.std.toFixed(4)],
      ["MD 最小值 (%)", +stats.min.toFixed(4), stats.minFreq ? `@ ${stats.minFreq.toFixed(4)} THz` : ""],
      ["MD 最大值 (%)", +stats.max.toFixed(4), stats.maxFreq ? `@ ${stats.maxFreq.toFixed(4)} THz` : ""],
      ["平均调制深度 (%)", +metrics.avgMd.toFixed(4), "(mean(Tmax) - mean(Tmin)) / mean(Tmax) × 100%"],
      ["频率范围 (THz)", stats.freqRangeStr],
      [],
      ["二、调节区间", "", "mean(Tmax列) - mean(Tmin列)"],
      ["统计量", "数值", "说明"],
      ["Tmax 列均值 (%)", +metrics.tmaxMean.toFixed(4)],
      ["Tmin 列均值 (%)", +metrics.tminMean.toFixed(4)],
      ["调节区间 (%)", +metrics.adjRange.toFixed(4)],
      [],
      ["三、调制范围", "", "max(Tmax列) - min(Tmin列)"],
      ["统计量", "数值", "说明"],
      ["Tmax 列最大值 (%)", +metrics.tmaxMax.toFixed(4), stats.maxFreq ? `@ ${stats.maxFreq.toFixed(4)} THz` : ""],
      ["Tmin 列最小值 (%)", +metrics.tminMin.toFixed(4), stats.minFreq ? `@ ${stats.minFreq.toFixed(4)} THz` : ""],
      ["调制范围 (%)", +metrics.modRange.toFixed(4)],
      [],
      ["四、插入损耗 IL", "", "IL = -10·log10(Tmax_abs)"],
      ["统计量", "数值", "说明"],
      ["Tmax 最大值", +metrics.tmaxMax.toFixed(4), metrics.tmaxMax > 1 ? "(百分比形式)" : "(绝对值形式)"],
      ["绝对透射率 Tmax_abs", +metrics.tmaxAbs.toFixed(6)],
      ["插入损耗 IL (dB)", +metrics.ilValue.toFixed(4), metrics.detectNote]
    ];
    const wsStat = XLSX.utils.aoa_to_sheet(statAoa);
    wsStat["!cols"] = [{ wch: 24 }, { wch: 24 }, { wch: 44 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "数据清单");
    XLSX.utils.book_append_sheet(wb, wsStat, "参数分析报告");

    const suggestedName = excelFile.name.replace(/\.(xlsx|xls|csv)$/i, "") + "_MD_计算报告.xlsx";

    try {
      const xlsxBuffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });

      // Check if showSaveFilePicker exists
      if ((window as any).showSaveFilePicker) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName,
            types: [{
              description: "Excel 工作簿 (*.xlsx)",
              accept: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] }
            }]
          });
          const writable = await handle.createWritable();
          await writable.write(xlsxBuffer);
          await writable.close();
          showToast(`已保存: ${handle.name}`, "success");
          return;
        } catch (err: any) {
          if (err.name === "AbortError") return; // User cancelled
        }
      }

      // Fallback anchor download
      const blob = new Blob([xlsxBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = suggestedName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast(`已下载: ${suggestedName} (默认保存至下载目录)`, "success");
    } catch (e: any) {
      showToast("文件导出失败: " + e.message, "error");
    }
  };

  // --- Export PowerPoint PPTX ---
  const handlePptExport = async () => {
    setIsSaving(true);
    try {
      const pptx = new pptxgen();
      pptx.layout = "LAYOUT_WIDE"; // 16:9 widescreen layout (13.33 x 7.5 inches)
      pptx.author = "THz Param Toolbox";
      pptx.title = "太赫兹调制器件参数分析报告";

      // 1. COLLAGE SLIDES (slide1 layout, 4 images per slide)
      const totalCollageSlides = Math.ceil(slideQueue.length / 4);
      const collageSlots = [
        { x: 0.22, y: 0.28, w: 4.46, h: 3.71 },
        { x: 7.59, y: 0.43, w: 4.39, h: 3.66 },
        { x: 0.76, y: 4.35, w: 3.60, h: 3.00 },
        { x: 8.10, y: 4.37, w: 3.58, h: 2.99 }
      ];

      for (let pageIdx = 0; pageIdx < totalCollageSlides; pageIdx++) {
        const slide = pptx.addSlide();
        slide.background = { color: "F8FAFC" };

        const startIdx = pageIdx * 4;
        const endIdx = Math.min(startIdx + 4, slideQueue.length);

        for (let slotIdx = 0; slotIdx < (endIdx - startIdx); slotIdx++) {
          const entry = slideQueue[startIdx + slotIdx];
          const slot = collageSlots[slotIdx];

          // Add image
          slide.addImage({
            data: entry.image,
            x: slot.x,
            y: slot.y,
            w: slot.w,
            h: slot.h,
            sizing: { type: "contain", w: slot.w, h: slot.h }
          });

          // Rect border
          slide.addShape(pptx.ShapeType.rect, {
            x: slot.x,
            y: slot.y,
            w: slot.w,
            h: slot.h,
            fill: { type: "none" },
            line: { color: "CBD5E1", width: 1 }
          });

          // Label
          slide.addText(entry.sourceFileName || `数据图 ${startIdx + slotIdx + 1}`, {
            x: slot.x,
            y: slot.y + slot.h + 0.05,
            w: slot.w,
            h: 0.25,
            fontSize: 10,
            color: "64748B",
            align: "center",
            fontFace: "Microsoft YaHei",
            italic: true
          });
        }

        // Slide title / label at bottom
        slide.addText(`太赫兹器件综合分析数据图拼贴报告 · 第 ${pageIdx + 1} / ${totalCollageSlides} 页`, {
          x: 0.5,
          y: 7.1,
          w: 12.33,
          h: 0.3,
          fontSize: 10,
          color: "94A3B8",
          align: "center",
          fontFace: "Microsoft YaHei"
        });
      }

      // 2. DATA DETAILS SLIDES (slide2 layout, 1 per Excel dataset)
      const cardDefs = [
        { bg: "FEF2F2", accent: "DC2626", title: "平均调制深度", getValue: (m: any) => fmt(m.avgMd) + " %" },
        { bg: "F0FDFA", accent: "0D9488", title: "插入损耗 IL", getValue: (m: any) => fmt(m.ilValue) + " dB" },
        { bg: "FFF7ED", accent: "EA580C", title: "调节区间", getValue: (m: any) => fmt(m.adjRange) + " %" },
        { bg: "F5F3FF", accent: "7C3AED", title: "调制范围", getValue: (m: any) => fmt(m.modRange) + " %" }
      ];

      slideQueue.forEach((entry, idx) => {
        const slide = pptx.addSlide();
        slide.background = { color: "F8FAFC" };

        // Top Centered Image: x=4.30, y=0.00, w=4.31, h=3.59
        slide.addImage({
          data: entry.image,
          x: 4.30,
          y: 0.05,
          w: 4.31,
          h: 3.49,
          sizing: { type: "contain", w: 4.31, h: 3.49 }
        });

        slide.addShape(pptx.ShapeType.rect, {
          x: 4.30,
          y: 0.05,
          w: 4.31,
          h: 3.49,
          fill: { type: "none" },
          line: { color: "CBD5E1", width: 1 }
        });

        // Heading Label
        slide.addText(`#${idx + 1}  ${entry.sourceFileName}`, {
          x: 0.45,
          y: 3.55,
          w: 12.43,
          h: 0.35,
          fontSize: 13,
          bold: true,
          color: "1E293B",
          fontFace: "Microsoft YaHei",
          align: "center"
        });

        // 4 Bottom Cards: y=3.95, height=1.50
        const cardY = 3.95;
        const cardW = 2.85;
        const cardH = 1.50;
        const gaps = [0.45, 3.50, 6.55, 9.60];

        cardDefs.forEach((c, cIdx) => {
          const cardX = gaps[cIdx];

          // Fill bg rect
          slide.addShape(pptx.ShapeType.rect, {
            x: cardX,
            y: cardY,
            w: cardW,
            h: cardH,
            fill: { color: c.bg },
            line: { color: c.accent, width: 1 }
          });

          // Left 8pt thick colored ribbon
          slide.addShape(pptx.ShapeType.rect, {
            x: cardX,
            y: cardY,
            w: 0.08,
            h: cardH,
            fill: { color: c.accent },
            line: { type: "none" }
          });

          // Title
          slide.addText(c.title, {
            x: cardX + 0.15,
            y: cardY + 0.15,
            w: cardW - 0.25,
            h: 0.3,
            fontSize: 11,
            bold: true,
            color: "64748B",
            fontFace: "Microsoft YaHei"
          });

          // Value
          slide.addText(c.getValue(entry.metrics), {
            x: cardX + 0.15,
            y: cardY + 0.5,
            w: cardW - 0.25,
            h: 0.7,
            fontSize: 24,
            bold: true,
            color: c.accent,
            fontFace: "Arial"
          });
        });

        // Metadata specs at bottom
        slide.addText(`最大透射列: ${entry.metrics.tmaxName || "—"}   ·   最小透射列: ${entry.metrics.tminName || "—"}`, {
          x: 0.5,
          y: 5.55,
          w: 12.33,
          h: 0.25,
          fontSize: 10.5,
          color: "64748B",
          align: "center",
          fontFace: "Microsoft YaHei",
          italic: true
        });

        // Footer standard credit
        slide.addText(`太赫兹调制参数计算与综合分析报告 · Z.ai`, {
          x: 0.5,
          y: 7.1,
          w: 12.33,
          h: 0.25,
          fontSize: 9.5,
          color: "94A3B8",
          align: "center",
          fontFace: "Microsoft YaHei"
        });
      });

      // Save logic with custom Modal or File Picker
      const finalBlob = await pptx.write({ outputType: "blob" }) as Blob;
      
      let finalFilename = saveFilename.trim();
      if (!finalFilename) finalFilename = "太赫兹器件参数综合分析报告.pptx";
      if (!/\.pptx$/i.test(finalFilename)) finalFilename += ".pptx";

      // File system Save Picker
      if ((window as any).showSaveFilePicker) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: finalFilename,
            types: [{
              description: "PowerPoint 演示文稿 (*.pptx)",
              accept: { "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"] }
            }]
          });
          const writable = await handle.createWritable();
          await writable.write(finalBlob);
          await writable.close();
          showToast(`已成功保存 PPT: ${handle.name}`, "success");
          setShowSaveModal(false);
          setIsSaving(false);
          return;
        } catch (err: any) {
          if (err.name === "AbortError") {
            setIsSaving(false);
            return; // Cancelled silently
          }
        }
      }

      // Fallback Anchor Download
      const url = URL.createObjectURL(finalBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = finalFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      showToast(`报告已成功导出，请查看浏览器下载内容。`, "success");
      setShowSaveModal(false);
      setIsSaving(false);
    } catch (err: any) {
      console.error("PPT Generation Error", err);
      showToast("PPT 导出失败: " + err.message, "error");
      setIsSaving(false);
    }
  };

  const handleAddMore = () => {
    setExcelFile(null);
    setHeaders([]);
    setRawData([]);
    setSheetName("");
    setImageDataUrl(null);
    setImageFileName("");
    setResultData([]);
    setResultHeaders([]);
    setStep(1);
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Back bar and queue counter */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-200">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition-all cursor-pointer"
        >
          ← 返回工具箱
        </button>
        <div className="flex items-center gap-3">
          {slideQueue.length > 0 && (
            <button
              onClick={() => {
                if(confirm("确定要清空已生成的全部 " + slideQueue.length + " 页幻灯片吗？")) {
                  onClearQueue();
                  showToast("已清空队列", "info");
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs text-rose-700 font-bold cursor-pointer transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              清空队列
            </button>
          )}
          <span className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>已生成 {slideQueue.length} 页幻灯片</span>
          </span>
        </div>
      </div>

      <header className="space-y-2 text-center py-4 bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">太赫兹调制器件参数计算引擎</h1>
        <p className="text-xs text-slate-500 max-w-xl mx-auto leading-relaxed">
          导入 Excel 谱图数据 → 绑定参考插图 → 映射波长及透射率列 → 系统自动完成全频段特征参数计算。
        </p>
      </header>

      {/* STEP 1: Upload Excel */}
      {step === 1 && (
        <div
          ref={dropZoneExcelRef}
          onClick={() => excelInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDropExcel}
          className="min-h-[220px] flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 hover:border-[var(--primary)] rounded-xl bg-white hover:bg-slate-50/50 cursor-pointer transition-all shadow-sm"
        >
          <FileSpreadsheet className="w-12 h-12 text-slate-400 mb-4" />
          <span className="text-sm font-extrabold text-slate-800">点击或拖拽 Excel 数据表格到此处</span>
          <span className="text-[11px] text-slate-400 mt-2 max-w-md leading-relaxed text-center font-mono">
            支持 .xlsx / .xls / .csv 格式表格　·　数据仅在前端浏览器内存解析，绝不上传，绝对保密。
          </span>
          <input
            type="file"
            ref={excelInputRef}
            onChange={(e) => e.target.files?.[0] && handleExcelFile(e.target.files[0])}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />
        </div>
      )}

      {/* STEP 2: Upload Image */}
      {step === 2 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-slate-800 text-white text-[11px] font-mono font-bold flex items-center justify-center">02</span>
            导入光谱测试参考图
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
            此图片将作为该组透射数据的分析插图，自动合成至输出幻灯片（Slide）的上半部分。支持 PNG、JPG、JPEG、WebP 格式。
          </p>

          {!imageDataUrl ? (
            <div
              ref={dropZoneImageRef}
              onClick={() => imageInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDropImage}
              className="min-h-[180px] flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 hover:border-[var(--primary)] rounded-xl bg-slate-50 hover:bg-white cursor-pointer transition-all"
            >
              <ImageIcon className="w-10 h-10 text-slate-400 mb-3" />
              <span className="text-xs font-bold text-slate-700">点击或拖拽参考图到此处</span>
              <span className="text-[10px] text-slate-400 mt-1">支持拖拽或直接点击上传</span>
              <input
                type="file"
                ref={imageInputRef}
                onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
                accept="image/*"
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center max-w-md mx-auto">
                <img
                  src={imageDataUrl}
                  alt="参考图预览"
                  className="max-h-[220px] rounded-lg object-contain shadow-sm bg-white border border-slate-200"
                />
                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 py-1 px-3 rounded-full mt-3">
                  已绑定: {imageFileName}
                </span>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => {
                    setImageDataUrl(null);
                    setImageFileName("");
                    if (imageInputRef.current) imageInputRef.current.value = "";
                  }}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  重选图片
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="px-4 py-2 text-white hover:opacity-95 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  style={{ backgroundColor: "var(--primary)" }}
                >
                  确认插图，进入下一步 <Sliders className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: Mapping Columns */}
      {step === 3 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-slate-800 text-white text-[11px] font-mono font-bold flex items-center justify-center">03</span>
            配置数据列字段映射
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            请正确选择 Excel 中的特定数据列。系统已基于常见数据集自动匹配了可能对应的透射率列。
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">频率列 (横坐标):</label>
              <select
                value={freqIdx}
                onChange={(e) => setFreqIdx(parseInt(e.target.value, 10))}
                className="w-full bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              >
                {headers.map((h, i) => (
                  <option key={i} value={i}>{`${i + 1}. ${h}`}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Tmax 列 (最大值 / 还原态):</label>
              <select
                value={tmaxIdx}
                onChange={(e) => setTmaxIdx(parseInt(e.target.value, 10))}
                className="w-full bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              >
                {headers.map((h, i) => (
                  <option key={i} value={i}>{`${i + 1}. ${h}`}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Tmin 列 (最小值 / 氧化态):</label>
              <select
                value={tminIdx}
                onChange={(e) => setTminIdx(parseInt(e.target.value, 10))}
                className="w-full bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              >
                {headers.map((h, i) => (
                  <option key={i} value={i}>{`${i + 1}. ${h}`}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5 max-w-xs">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">输出 MD 的列命名:</label>
            <input
              type="text"
              value={mdColName}
              onChange={(e) => setMdColName(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              placeholder="Modulation Depth (%)"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCalculate}
              className="px-5 py-2.5 text-white hover:opacity-95 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              style={{ backgroundColor: "var(--primary)" }}
            >
              <Settings className="w-4 h-4" />
              计算器件特征参数
            </button>
            <button
              onClick={() => {
                setExcelFile(null);
                setHeaders([]);
                setRawData([]);
                setStep(1);
              }}
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              重新选择文件
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Results Display */}
      {step === 4 && (
        <div className="space-y-6">
          
          {/* Summary Dashboard Grid */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="w-5 h-5 rounded bg-slate-800 text-white text-[11px] font-mono font-bold flex items-center justify-center">04</span>
              本批次计算参数汇总 (Key Parameters Summary)
            </h2>

            {/* Geometric Balance Grid cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 0: 平均调制深度 */}
              <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 border-l-4 border-rose-500 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">
                    <span>平均调制深度</span>
                    <span className="text-rose-500 font-black">★</span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-mono italic">mean(Tmax-Tmin)/mean(Tmax)</p>
                </div>
                <div className="my-3">
                  <span className="text-3xl font-extrabold text-slate-800">{fmt(metrics.avgMd)}</span>
                  <span className="text-xs text-slate-500 font-bold ml-1">%</span>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-400 leading-normal">
                    最大与最小透射率列均值相除所得。
                  </p>
                  <div className="flex flex-col gap-1 text-[9px] font-mono text-slate-500 bg-slate-50 p-2 rounded">
                    <span>Tmax 均值: <b>{fmt(metrics.tmaxMean)}%</b></span>
                    <span>Tmin 均值: <b>{fmt(metrics.tminMean)}%</b></span>
                  </div>
                </div>
              </div>

              {/* Card 1: 调节区间 */}
              <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 border-l-4 border-amber-500 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">
                    <span>调节区间</span>
                    <span className="text-amber-500 font-black">I</span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-mono italic">mean(Tmax) - mean(Tmin)</p>
                </div>
                <div className="my-3">
                  <span className="text-3xl font-extrabold text-slate-800">{fmt(metrics.adjRange)}</span>
                  <span className="text-xs text-slate-500 font-bold ml-1">%</span>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-400 leading-normal">
                    两组透射率列均值的绝对差值。
                  </p>
                  <div className="flex flex-col gap-1 text-[9px] font-mono text-slate-500 bg-slate-50 p-2 rounded">
                    <span>有效数据点: <b>{stats.count} 行</b></span>
                  </div>
                </div>
              </div>

              {/* Card 2: 调制范围 */}
              <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 border-l-4 border-violet-500 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">
                    <span>调制范围</span>
                    <span className="text-violet-500 font-black">II</span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-mono italic">max(Tmax) - min(Tmin)</p>
                </div>
                <div className="my-3">
                  <span className="text-3xl font-extrabold text-slate-800">{fmt(metrics.modRange)}</span>
                  <span className="text-xs text-slate-500 font-bold ml-1">%</span>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-400 leading-normal">
                    极限最大透射与极小透射总跨度。
                  </p>
                  <div className="flex flex-col gap-1 text-[9px] font-mono text-slate-500 bg-slate-50 p-2 rounded">
                    <span>Max Tmax: <b>{fmt(metrics.tmaxMax)}%</b></span>
                    <span>Min Tmin: <b>{fmt(metrics.tminMin)}%</b></span>
                  </div>
                </div>
              </div>

              {/* Card 3: 插入损耗 IL */}
              <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 border-l-4 border-cyan-500 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">
                    <span>插入损耗 IL</span>
                    <span className="text-cyan-500 font-black">III</span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-mono italic">-10·log10(T_abs)</p>
                </div>
                <div className="my-3">
                  <span className="text-3xl font-extrabold text-slate-800">{fmt(metrics.ilValue)}</span>
                  <span className="text-xs text-slate-500 font-bold ml-1">dB</span>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-400 leading-normal">
                    器件还原态信号透射损耗程度。
                  </p>
                  <div className="flex flex-col gap-1 text-[9px] font-mono text-slate-500 bg-slate-50 p-2 rounded">
                    <span>Tmax_abs: <b>{metrics.tmaxAbs.toFixed(5)}</b></span>
                  </div>
                </div>
              </div>

            </div>

            {/* Quick action buttons */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={downloadExcel}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                下载分析结果 Excel 报表
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                返回修改映射
              </button>
            </div>
          </div>

          {/* Mini Statistics Widget Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm text-center">
              <span className="block text-[10px] uppercase font-bold text-slate-400 font-mono">数据点总数</span>
              <span className="block text-base font-extrabold text-slate-800 mt-1">{stats.count}</span>
            </div>
            <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm text-center">
              <span className="block text-[10px] uppercase font-bold text-slate-400 font-mono">MD 均值</span>
              <span className="block text-base font-extrabold text-rose-600 mt-1">{stats.mean.toFixed(3)}%</span>
            </div>
            <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm text-center">
              <span className="block text-[10px] uppercase font-bold text-slate-400 font-mono">MD 中位数</span>
              <span className="block text-base font-extrabold text-slate-800 mt-1">{stats.median.toFixed(3)}%</span>
            </div>
            <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm text-center">
              <span className="block text-[10px] uppercase font-bold text-slate-400 font-mono">MD 标准差</span>
              <span className="block text-base font-extrabold text-slate-800 mt-1">{stats.std.toFixed(3)}%</span>
            </div>
            <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm text-center overflow-hidden">
              <span className="block text-[10px] uppercase font-bold text-slate-400 font-mono">MD 最大值</span>
              <span className="block text-sm font-extrabold text-rose-600 mt-1 truncate">{stats.max.toFixed(3)}%</span>
              <span className="block text-[9px] text-slate-400 mt-0.5 truncate font-mono">@ {stats.maxFreq.toFixed(3)} THz</span>
            </div>
            <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm text-center overflow-hidden">
              <span className="block text-[10px] uppercase font-bold text-slate-400 font-mono">频率范围</span>
              <span className="block text-xs font-extrabold text-slate-700 mt-1.5 truncate font-mono">{stats.freqRangeStr}</span>
            </div>
          </div>

          {/* Data Table Preview (collapsible) */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-[11px] font-bold text-slate-600">全频段结果预览表 (仅展示前 100 行)</span>
              <span className="text-[10px] font-mono text-slate-400">Tmax: {headers[tmaxIdx]}　|　Tmin: {headers[tminIdx]}</span>
            </div>
            <div className="max-h-[300px] overflow-auto">
              <table className="w-full text-[11px] text-left border-collapse tabular-nums font-mono">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase sticky top-0 border-b border-slate-200">
                  <tr>
                    {resultHeaders.map((h, i) => (
                      <th key={i} className={`p-2 border-b border-slate-200 text-center ${i === resultHeaders.length - 1 ? "bg-rose-50/50 text-rose-800 font-bold" : ""}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {resultData.slice(0, 100).map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50/50">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className={`p-2 text-center border-b border-slate-100 ${cIdx === row.length - 1 ? "bg-rose-50/20 text-rose-600 font-bold" : ""}`}>
                          {cell === null ? "—" : typeof cell === "number" ? cell.toFixed(4) : cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Final continuous workflow action bar */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">本页数据分析已成功加入导出队列 (目前共 {slideQueue.length} 页)</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              您可以继续导入下一组太赫兹测试数据（将自动追加至您的 PPT 演示文稿），也可以点击完成，并定制生成包含所有数据的高清 PPTX。
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={handleAddMore}
                className="px-4 py-2.5 rounded-lg text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                style={{ backgroundColor: "var(--primary)" }}
              >
                <Plus className="w-4 h-4" />
                ➕ 继续导入下一组 Excel 与图片
              </button>
              <button
                onClick={() => setShowSaveModal(true)}
                className="px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
              >
                <Presentation className="w-4 h-4" />
                📊 完成并生成高清 PPT 报告
              </button>
            </div>
          </div>

        </div>
      )}

      {/* --- SAVE LOCATION MODAL (PEAK CUSTOM ACCURACY) --- */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 max-w-md w-full shadow-xl space-y-5 animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-2xl shadow-inner mx-auto">
              📊
            </div>
            
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-800">请指定 PPT 导出设置</h3>
              <p className="text-xs text-slate-400">即将编译生成您的多幻灯片完整参数分析 PPT 报告。</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg text-xs text-slate-600 space-y-1 font-mono">
              <div className="font-bold text-slate-700">报告概览：</div>
              <div>• 总计包含: <b>{Math.ceil(slideQueue.length / 4) + slideQueue.length}</b> 页幻灯片</div>
              <div>• 包含: <b>{Math.ceil(slideQueue.length / 4)}</b> 页综合分析图 (4合1拼贴)</div>
              <div>• 包含: <b>{slideQueue.length}</b> 页数据详情大卡片</div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 block">自定义文件名</label>
              <input
                type="text"
                value={saveFilename}
                onChange={(e) => setSaveFilename(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                placeholder="太赫兹器件参数综合分析报告.pptx"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                disabled={isSaving}
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition-all flex-1 cursor-pointer"
              >
                取消
              </button>
              <button
                disabled={isSaving}
                onClick={handlePptExport}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex-1 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    导出 PPT
                  </>
                )}
              </button>
            </div>

            <div className="text-[10px] text-slate-400 text-center leading-relaxed">
              {(window as any).showSaveFilePicker ? (
                "💡 点击导出后，将弹出 Windows 系统「另存为」对话框，支持自由选择本地保存目录与修改文件名。"
              ) : (
                "💡 您的浏览器由于版本限制不支持直接保存，生成后将自动静默下载到系统默认「下载 (Downloads)」文件夹。"
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

interface ClickPoint {
  x: number;
  y: number;
}

const COLORS = ["#00f5ff", "#ff006e", "#fb5607", "#ffbe0b", "#8338ec", "#3a86ff"];

export default function Index() {
  const [isRunning, setIsRunning] = useState(false);
  const [clickPoint, setClickPoint] = useState<ClickPoint | null>(null);
  const [totalClicks, setTotalClicks] = useState(0);
  const [cps, setCps] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [cpsInput, setCpsInput] = useState(10);
  const [delay, setDelay] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isSettingPoint, setIsSettingPoint] = useState(false);
  const [sessionBest, setSessionBest] = useState(0);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const intervalRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const particleIdRef = useRef(0);
  const rippleIdRef = useRef(0);
  const clickHistoryRef = useRef<number[]>([]);
  const clickPointRef = useRef<ClickPoint | null>(null);

  useEffect(() => {
    clickPointRef.current = clickPoint;
  }, [clickPoint]);

  const spawnParticles = useCallback((x: number, y: number) => {
    const count = 8;
    const newParticles: Particle[] = Array.from({ length: count }, () => ({
      id: particleIdRef.current++,
      x,
      y,
      vx: (Math.random() - 0.5) * 7,
      vy: (Math.random() - 0.5) * 7 - 1.5,
      life: 1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));
    setParticles((prev) => [...prev.slice(-60), ...newParticles]);

    const rippleId = rippleIdRef.current++;
    setRipples((prev) => [...prev.slice(-10), { id: rippleId, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== rippleId));
    }, 600);
  }, []);

  useEffect(() => {
    if (particles.length === 0) return;
    const raf = requestAnimationFrame(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.25, life: p.life - 0.05 }))
          .filter((p) => p.life > 0)
      );
    });
    return () => cancelAnimationFrame(raf);
  }, [particles]);

  const doClick = useCallback(() => {
    const pt = clickPointRef.current;
    if (!pt) return;
    setTotalClicks((t) => t + 1);
    clickHistoryRef.current = [...clickHistoryRef.current.slice(-49), Date.now()];
    spawnParticles(pt.x, pt.y);
  }, [spawnParticles]);

  useEffect(() => {
    if (!isRunning || !clickPoint) return;
    const interval = Math.max(50, Math.round(1000 / cpsInput) + delay);
    intervalRef.current = window.setInterval(doClick, interval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, clickPoint, cpsInput, delay, doClick]);

  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    startTimeRef.current = Date.now() - elapsedTime * 1000;
    timerRef.current = window.setInterval(() => {
      setElapsedTime((Date.now() - startTimeRef.current) / 1000);
      const now = Date.now();
      const recent = clickHistoryRef.current.filter((t) => now - t < 1000);
      const currentCps = recent.length;
      setCps(currentCps);
      setSessionBest((prev) => Math.max(prev, currentCps));
    }, 200);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const handleStart = () => {
    if (!clickPoint) {
      setIsSettingPoint(true);
      return;
    }
    clickHistoryRef.current = [];
    setIsRunning(true);
  };

  const handleStop = () => {
    setIsRunning(false);
    setCps(0);
  };

  const handleReset = () => {
    handleStop();
    setTotalClicks(0);
    setElapsedTime(0);
    setSessionBest(0);
    clickHistoryRef.current = [];
    setCps(0);
  };

  const handleAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSettingPoint) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setClickPoint({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setIsSettingPoint(false);
  };

  const handleAreaTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isSettingPoint) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    setClickPoint({ x: touch.clientX - rect.left, y: touch.clientY - rect.top });
    setIsSettingPoint(false);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const intensityPct = cpsInput > 0 ? Math.min(100, Math.round((cps / cpsInput) * 100)) : 0;

  return (
    <div className="ac-root">
      <div className="ac-scanlines" />
      <div className="ac-gridbg" />

      {/* HEADER */}
      <header className="ac-header">
        <div className="ac-logo">
          <span>⚡</span>
          <span className="ac-logo-text">AUTO<span className="ac-logo-accent">CLICKER</span></span>
          <span className="ac-logo-pro">PRO</span>
        </div>
        <div className="ac-status">
          <span className={`ac-status-dot ${isRunning ? "ac-dot-active" : ""}`} />
          <span className="ac-status-label">{isRunning ? "АКТИВЕН" : "ГОТОВ"}</span>
        </div>
      </header>

      <main className="ac-main">
        {/* ЗОНА КЛИКА */}
        <div
          className={`ac-zone ${isSettingPoint ? "ac-zone-setting" : ""} ${isRunning ? "ac-zone-running" : ""}`}
          onClick={handleAreaClick}
          onTouchStart={handleAreaTouch}
        >
          {isSettingPoint && (
            <div className="ac-zone-hint">
              <div className="ac-hint-pulse" />
              <span>Нажмите, чтобы установить точку</span>
            </div>
          )}

          {!clickPoint && !isSettingPoint && (
            <div className="ac-zone-empty">
              <Icon name="Crosshair" size={32} />
              <span>Нажмите «Установить точку»</span>
            </div>
          )}

          {clickPoint && (
            <div className="ac-crosshair" style={{ left: clickPoint.x, top: clickPoint.y }}>
              <div className="ac-ch-ring" />
              <div className="ac-ch-ring ac-ch-ring2" />
              <div className="ac-ch-dot" />
              <div className="ac-ch-hline" />
              <div className="ac-ch-vline" />
              <div className="ac-ch-tag">ЦЕЛЬ</div>
            </div>
          )}

          {particles.map((p) => (
            <div
              key={p.id}
              className="ac-particle"
              style={{
                left: p.x,
                top: p.y,
                background: p.color,
                opacity: p.life,
                boxShadow: `0 0 8px ${p.color}`,
              }}
            />
          ))}

          {ripples.map((r) => (
            <div
              key={r.id}
              className="ac-ripple"
              style={{ left: r.x, top: r.y }}
            />
          ))}
        </div>

        {/* СТАТИСТИКА */}
        <div className="ac-stats">
          <div className="ac-stat">
            <div className="ac-stat-icon">🖱️</div>
            <div className="ac-stat-value">{totalClicks.toLocaleString()}</div>
            <div className="ac-stat-label">КЛИКОВ</div>
          </div>
          <div className="ac-stat ac-stat-cps">
            <div className="ac-stat-icon">⚡</div>
            <div className="ac-stat-value ac-neon">{cps}</div>
            <div className="ac-stat-label">CPS</div>
          </div>
          <div className="ac-stat">
            <div className="ac-stat-icon">⏱️</div>
            <div className="ac-stat-value">{formatTime(elapsedTime)}</div>
            <div className="ac-stat-label">ВРЕМЯ</div>
          </div>
          <div className="ac-stat">
            <div className="ac-stat-icon">🏆</div>
            <div className="ac-stat-value ac-gold">{sessionBest}</div>
            <div className="ac-stat-label">РЕКОРД</div>
          </div>
        </div>

        {/* НАСТРОЙКИ */}
        <div className="ac-settings">
          <div className="ac-setting-row">
            <div className="ac-setting-label">
              <Icon name="Zap" size={15} />
              <span>СКОРОСТЬ</span>
              <span className="ac-setting-val">{cpsInput} CPS</span>
            </div>
            <input
              type="range"
              min={1}
              max={50}
              value={cpsInput}
              onChange={(e) => setCpsInput(Number(e.target.value))}
              className="ac-slider"
              disabled={isRunning}
            />
            <div className="ac-slider-marks">
              {[1, 10, 20, 30, 40, 50].map((v) => (
                <span key={v}>{v}</span>
              ))}
            </div>
          </div>

          <div className="ac-setting-row">
            <div className="ac-setting-label">
              <Icon name="Timer" size={15} />
              <span>ЗАДЕРЖКА</span>
              <span className="ac-setting-val">{delay} мс</span>
            </div>
            <input
              type="range"
              min={0}
              max={500}
              step={10}
              value={delay}
              onChange={(e) => setDelay(Number(e.target.value))}
              className="ac-slider ac-slider-orange"
              disabled={isRunning}
            />
            <div className="ac-slider-marks">
              {[0, 100, 200, 300, 400, 500].map((v) => (
                <span key={v}>{v}</span>
              ))}
            </div>
          </div>
        </div>

        {/* КНОПКИ */}
        <div className="ac-controls">
          <button
            className="ac-btn ac-btn-set"
            onClick={() => { handleStop(); setIsSettingPoint(true); }}
            disabled={isRunning}
          >
            <Icon name="Crosshair" size={17} />
            <span>ТОЧКА</span>
          </button>

          {!isRunning ? (
            <button className="ac-btn ac-btn-start" onClick={handleStart}>
              <Icon name="Play" size={20} />
              <span>СТАРТ</span>
            </button>
          ) : (
            <button className="ac-btn ac-btn-stop" onClick={handleStop}>
              <Icon name="Square" size={20} />
              <span>СТОП</span>
            </button>
          )}

          <button className="ac-btn ac-btn-reset" onClick={handleReset} disabled={isRunning}>
            <Icon name="RotateCcw" size={17} />
            <span>СБРОС</span>
          </button>
        </div>

        {/* ИНДИКАТОР ИНТЕНСИВНОСТИ */}
        <div className="ac-intensity">
          <div className="ac-int-header">
            <span>ИНТЕНСИВНОСТЬ</span>
            <span className="ac-int-pct">{intensityPct}%</span>
          </div>
          <div className="ac-int-track">
            <div className="ac-int-fill" style={{ width: `${intensityPct}%` }} />
            <div className="ac-int-segments">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="ac-int-seg" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

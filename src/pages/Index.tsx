import { useState } from "react";
import Icon from "@/components/ui/icon";

const STEPS = [
  {
    num: "01",
    icon: "Github",
    title: "Создай репозиторий на GitHub",
    desc: "Зарегистрируйся на github.com и создай новый пустой репозиторий (любое название)",
    action: "Открыть GitHub",
    link: "https://github.com/new",
    color: "#00f5ff",
  },
  {
    num: "02",
    icon: "Upload",
    title: "Загрузи файлы автокликера",
    desc: 'Скачай код сайта через меню "Скачать → Скачать код". В репозитории нажми "uploading an existing file" и загрузи папку android-autoclicker',
    action: null,
    link: null,
    color: "#ffbe0b",
  },
  {
    num: "03",
    icon: "Zap",
    title: "Actions запустит сборку сам",
    desc: 'Перейди во вкладку "Actions" в репозитории — сборка APK стартует автоматически. Занимает около 15–20 минут.',
    action: null,
    link: null,
    color: "#8338ec",
  },
  {
    num: "04",
    icon: "Download",
    title: "Скачай готовый APK",
    desc: 'В Actions → последний билд → раздел "Artifacts" → скачай файл AutoClicker-Pro-APK',
    action: null,
    link: null,
    color: "#00ff88",
  },
  {
    num: "05",
    icon: "Smartphone",
    title: "Установи на Android",
    desc: 'Разреши установку из неизвестных источников → установи APK → при первом запуске дай разрешение "Поверх других приложений"',
    action: null,
    link: null,
    color: "#ff006e",
  },
];

const FEATURES = [
  { icon: "Crosshair", text: "Точечные касания — не мешают джойстику" },
  { icon: "Layers", text: "Несколько точек одновременно" },
  { icon: "Zap", text: "Скорость 1–50 кликов в секунду" },
  { icon: "Timer", text: "Задержка между кликами" },
  { icon: "Clock", text: "Автостоп по времени или количеству" },
  { icon: "Eye", text: "Работает поверх любых игр" },
  { icon: "ToggleLeft", text: "Вкл/выкл каждой точки отдельно" },
  { icon: "BarChart2", text: "Статистика CPS в реальном времени" },
  { icon: "Save", text: "Сохранение настроек между сессиями" },
  { icon: "Smartphone", text: "Настройка прямо в игре" },
];

export default function Index() {
  const [expandedStep, setExpandedStep] = useState<number | null>(0);

  return (
    <div className="ac-root">
      <div className="ac-scanlines" />
      <div className="ac-gridbg" />

      <header className="ac-header">
        <div className="ac-logo">
          <span>⚡</span>
          <span className="ac-logo-text">AUTO<span className="ac-logo-accent">CLICKER</span></span>
          <span className="ac-logo-pro">PRO</span>
        </div>
        <div className="ac-badge-android">
          <Icon name="Smartphone" size={13} />
          <span>Android APK</span>
        </div>
      </header>

      <main className="ac-main ac-main-guide">

        {/* HERO */}
        <div className="ac-hero">
          <div className="ac-hero-tag">ПОВЕРХ ЛЮБЫХ ИГР</div>
          <h1 className="ac-hero-title">
            Настоящий<br />
            <span className="ac-hero-accent">автокликер</span><br />
            для Android
          </h1>
          <p className="ac-hero-sub">
            Работает поверх игр · Точечные касания · Не мешает джойстику
          </p>

          <a
            href="https://github.com/new"
            target="_blank"
            rel="noopener noreferrer"
            className="ac-btn-hero"
          >
            <Icon name="Github" size={20} />
            <span>Начать сборку APK</span>
            <Icon name="ArrowRight" size={18} />
          </a>

          <div className="ac-hero-note">
            <Icon name="Info" size={13} />
            <span>Бесплатно · GitHub Actions · ~15–20 минут</span>
          </div>
        </div>

        {/* FEATURES */}
        <div className="ac-section">
          <div className="ac-section-title">
            <span className="ac-section-line" />
            <span>ВОЗМОЖНОСТИ</span>
            <span className="ac-section-line" />
          </div>
          <div className="ac-features">
            {FEATURES.map((f, i) => (
              <div key={i} className="ac-feature">
                <Icon name={f.icon} size={15} />
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* STEPS */}
        <div className="ac-section">
          <div className="ac-section-title">
            <span className="ac-section-line" />
            <span>КАК ПОЛУЧИТЬ APK — 5 ШАГОВ</span>
            <span className="ac-section-line" />
          </div>

          <div className="ac-steps">
            {STEPS.map((step, i) => (
              <div
                key={i}
                className={`ac-step ${expandedStep === i ? "ac-step-open" : ""}`}
                onClick={() => setExpandedStep(expandedStep === i ? null : i)}
                style={{ "--step-color": step.color } as React.CSSProperties}
              >
                <div className="ac-step-header">
                  <div className="ac-step-num" style={{ color: step.color }}>{step.num}</div>
                  <div className="ac-step-icon" style={{ background: `${step.color}22`, border: `1px solid ${step.color}44` }}>
                    <Icon name={step.icon} size={17} />
                  </div>
                  <div className="ac-step-title">{step.title}</div>
                  <Icon name={expandedStep === i ? "ChevronUp" : "ChevronDown"} size={16} />
                </div>
                {expandedStep === i && (
                  <div className="ac-step-body">
                    <p>{step.desc}</p>
                    {step.action && step.link && (
                      <a href={step.link} target="_blank" rel="noopener noreferrer" className="ac-step-link">
                        <Icon name="ExternalLink" size={13} />
                        {step.action}
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ИСХОДНЫЙ КОД */}
        <div className="ac-section">
          <div className="ac-section-title">
            <span className="ac-section-line" />
            <span>ИСХОДНЫЙ КОД</span>
            <span className="ac-section-line" />
          </div>

          <div className="ac-download-card">
            <div className="ac-dl-icon">📦</div>
            <div className="ac-dl-info">
              <div className="ac-dl-name">AutoClicker Pro</div>
              <div className="ac-dl-meta">main.py · buildozer.spec · GitHub Actions workflow</div>
            </div>
          </div>

          <div className="ac-tip">
            <Icon name="Info" size={14} />
            <span>
              Нажми <b>Скачать → Скачать код</b> в меню сайта сверху.
              Затем загрузи папку <b>android-autoclicker</b> в GitHub репозиторий — сборка запустится автоматически.
            </span>
          </div>
        </div>

        {/* ПОСЛЕ УСТАНОВКИ */}
        <div className="ac-section">
          <div className="ac-section-title">
            <span className="ac-section-line" />
            <span>ПОСЛЕ УСТАНОВКИ</span>
            <span className="ac-section-line" />
          </div>
          <div className="ac-perms">
            {[
              ["1", "Разреши установку APK", "Настройки → Безопасность → Неизвестные источники → ВКЛ"],
              ["2", "Разрешение «Поверх других приложений»", "Приложение само попросит при первом запуске"],
              ["3", "Открой игру → Alt+Tab в кликер", "Установи точки на вкладке «Зона», нажми Старт — работает поверх"],
            ].map(([num, title, desc]) => (
              <div key={num} className="ac-perm">
                <span className="ac-perm-num">{num}</span>
                <div>
                  <div className="ac-perm-title">{title}</div>
                  <div className="ac-perm-desc">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
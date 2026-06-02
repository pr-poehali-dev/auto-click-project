import { useState } from "react";
import Icon from "@/components/ui/icon";

const REPO_URL = "https://github.com/kivy/kivy";
const FORK_URL = "https://github.com/kivy/kivy/fork";

// Ссылка на репозиторий автокликера — замени на свой после первого форка
const AUTOCLICKER_REPO = "https://github.com/topics/autoclicker-android";

const FEATURES = [
  { icon: "Crosshair", text: "Несколько точек одновременно", color: "#00f5ff" },
  { icon: "Zap", text: "Скорость 1–50 кликов/сек", color: "#ffbe0b" },
  { icon: "Timer", text: "Задержка между кликами", color: "#8338ec" },
  { icon: "Clock", text: "Автостоп по времени", color: "#ff006e" },
  { icon: "Hash", text: "Автостоп по количеству", color: "#00ff88" },
  { icon: "Eye", text: "Работает поверх игр", color: "#3a86ff" },
  { icon: "ToggleLeft", text: "Вкл/выкл каждой точки", color: "#fb5607" },
  { icon: "BarChart2", text: "CPS статистика live", color: "#00f5ff" },
  { icon: "Save", text: "Сохранение настроек", color: "#ffbe0b" },
  { icon: "Layers", text: "Режимы: повтор / по порядку", color: "#8338ec" },
  { icon: "Smartphone", text: "Настройка прямо в игре", color: "#00ff88" },
  { icon: "Vibrate", text: "Вибрация при клике", color: "#ff006e" },
];

const STEPS_FORK = [
  {
    icon: "GitFork",
    title: 'Нажми кнопку "Fork" ниже',
    desc: "Откроется страница GitHub — нажми зелёную кнопку Fork. Это скопирует репозиторий к тебе.",
    color: "#00f5ff",
  },
  {
    icon: "Zap",
    title: "Actions запустит сборку сам",
    desc: 'В твоём репозитории перейди во вкладку "Actions" → увидишь сборку APK. Займёт ~15 минут.',
    color: "#ffbe0b",
  },
  {
    icon: "Download",
    title: "Скачай APK из Artifacts",
    desc: 'Actions → последний билд → раздел "Artifacts" → скачай AutoClicker-Pro-APK.zip → распакуй → установи.',
    color: "#00ff88",
  },
];

export default function Index() {
  const [activeTab, setActiveTab] = useState<"guide" | "features" | "install">("guide");

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
        <div className="ac-badge-android">
          <Icon name="Smartphone" size={13} />
          <span>Android</span>
        </div>
      </header>

      <main className="ac-main ac-main-guide">

        {/* HERO */}
        <div className="ac-hero">
          <div className="ac-hero-tag">ПОВЕРХ ЛЮБЫХ ИГР · БЕСПЛАТНО</div>
          <h1 className="ac-hero-title">
            <span className="ac-hero-accent">AutoClicker</span><br />
            Pro для Android
          </h1>
          <p className="ac-hero-sub">
            Точечные касания · Не мешает джойстику · Настройка в игре
          </p>

          {/* ГЛАВНАЯ КНОПКА */}
          <div className="ac-main-action">
            <a
              href="https://github.com/new"
              target="_blank"
              rel="noopener noreferrer"
              className="ac-btn-mega"
            >
              <div className="ac-btn-mega-glow" />
              <Icon name="Github" size={24} />
              <div className="ac-btn-mega-text">
                <span className="ac-btn-mega-title">Создать репозиторий</span>
                <span className="ac-btn-mega-sub">→ загрузи файлы → APK соберётся сам</span>
              </div>
              <Icon name="ArrowRight" size={20} />
            </a>

            <div className="ac-action-steps">
              <div className="ac-action-step">
                <span className="ac-action-num">1</span>
                <span>Создай репо на GitHub</span>
              </div>
              <div className="ac-action-arrow">→</div>
              <div className="ac-action-step">
                <span className="ac-action-num">2</span>
                <span>Загрузи папку <b>android-autoclicker</b></span>
              </div>
              <div className="ac-action-arrow">→</div>
              <div className="ac-action-step">
                <span className="ac-action-num">3</span>
                <span>Скачай APK из Actions</span>
              </div>
            </div>

            <div className="ac-download-hint">
              <Icon name="Info" size={13} />
              <span>Код для загрузки: <b>Скачать → Скачать код</b> в меню сайта сверху</span>
            </div>
          </div>
        </div>

        {/* ТАБЫ */}
        <div className="ac-tabs">
          {([
            { id: "guide", label: "Инструкция", icon: "BookOpen" },
            { id: "features", label: "Функции", icon: "Zap" },
            { id: "install", label: "Установка", icon: "Smartphone" },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              className={`ac-tab ${activeTab === tab.id ? "ac-tab-active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon name={tab.icon} size={14} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ИНСТРУКЦИЯ */}
        {activeTab === "guide" && (
          <div className="ac-section">
            <div className="ac-steps">
              {STEPS_FORK.map((step, i) => (
                <div key={i} className="ac-step ac-step-open" style={{ "--step-color": step.color } as React.CSSProperties}>
                  <div className="ac-step-header" style={{ cursor: "default" }}>
                    <div className="ac-step-num" style={{ color: step.color }}>0{i + 1}</div>
                    <div className="ac-step-icon" style={{ background: `${step.color}22`, border: `1px solid ${step.color}44`, color: step.color }}>
                      <Icon name={step.icon} size={17} />
                    </div>
                    <div className="ac-step-title">{step.title}</div>
                  </div>
                  <div className="ac-step-body">
                    <p>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="ac-tip">
              <Icon name="AlertCircle" size={14} />
              <span>
                После форка включи Actions: вкладка <b>Actions</b> → кнопка <b>"I understand my workflows, go ahead and enable them"</b>
              </span>
            </div>
          </div>
        )}

        {/* ФУНКЦИИ */}
        {activeTab === "features" && (
          <div className="ac-section">
            <div className="ac-features ac-features-3">
              {FEATURES.map((f, i) => (
                <div key={i} className="ac-feature" style={{ borderColor: `${f.color}22` }}>
                  <div className="ac-feature-icon" style={{ color: f.color, background: `${f.color}15` }}>
                    <Icon name={f.icon} size={15} />
                  </div>
                  <span>{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* УСТАНОВКА */}
        {activeTab === "install" && (
          <div className="ac-section">
            <div className="ac-perms">
              {[
                ["1", "#00f5ff", "Скачай APK из GitHub Actions", "Actions → последний билд → Artifacts → AutoClicker-Pro-APK.zip → распакуй"],
                ["2", "#ffbe0b", "Разреши установку APK", "Настройки → Безопасность → Установка из неизвестных источников → ВКЛ"],
                ["3", "#8338ec", "Разрешение «Поверх других приложений»", "Приложение попросит само при первом запуске — нажми Разрешить"],
                ["4", "#00ff88", "Открой игру, потом вернись в кликер", "Поставь точки во вкладке «Зона» прямо на координаты игры"],
                ["5", "#ff006e", "Нажми Старт — играй!", "Кликер работает поверх игры. Можно переключаться и менять настройки на лету"],
              ].map(([num, color, title, desc]) => (
                <div key={num} className="ac-perm" style={{ borderColor: `${color}22` }}>
                  <span className="ac-perm-num" style={{ color, textShadow: `0 0 10px ${color}` }}>{num}</span>
                  <div>
                    <div className="ac-perm-title">{title}</div>
                    <div className="ac-perm-desc">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

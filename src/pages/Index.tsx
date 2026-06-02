import { useState } from "react";
import Icon from "@/components/ui/icon";

const STEPS = [
  {
    num: 1,
    color: "#00f5ff",
    title: "Скачай код автокликера",
    emoji: "📥",
    substeps: [
      { text: 'Нажми кнопку \u00ABСкачать\u00BB в верхнем меню этого сайта', img: null },
      { text: 'Выбери \u00ABСкачать код\u00BB', img: null },
      { text: "Сохрани ZIP-архив на телефон или компьютер", img: null },
    ],
    tip: "Кнопка «Скачать» — в правом верхнем углу страницы сайта",
  },
  {
    num: 2,
    color: "#ffbe0b",
    title: "Открой GitHub и войди",
    emoji: "🐙",
    substeps: [
      { text: "Открой github.com в браузере", link: "https://github.com", linkText: "Открыть GitHub" },
      { text: 'Нажми \u00ABSign in\u00BB если есть аккаунт, или \u00ABSign up\u00BB для регистрации (бесплатно)', img: null },
      { text: "Войди в свой аккаунт", img: null },
    ],
    tip: "Регистрация бесплатная, нужен только email",
  },
  {
    num: 3,
    color: "#8338ec",
    title: "Создай новый репозиторий",
    emoji: "📁",
    substeps: [
      { text: "Нажми на кнопку ниже — откроется форма создания репозитория", link: "https://github.com/new", linkText: "➕ Создать репозиторий" },
      { text: 'В поле \u00ABRepository name\u00BB напиши любое название, например: autoclicker', img: null },
      { text: 'Убедись что выбрано \u00ABPublic\u00BB', img: null },
      { text: 'Нажми зелёную кнопку \u00ABCreate repository\u00BB внизу', img: null },
    ],
    tip: null,
  },
  {
    num: 4,
    color: "#00ff88",
    title: "Загрузи файлы автокликера",
    emoji: "📤",
    substeps: [
      { text: 'На странице репозитория нажми \u00ABuploading an existing file\u00BB (синяя ссылка в центре)', img: null },
      { text: "Распакуй скачанный ZIP и загрузи ТОЛЬКО папку android-autoclicker (перетащи её или нажми choose your files)", img: null },
      { text: 'Прокрути вниз, нажми зелёную кнопку \u00ABCommit changes\u00BB', img: null },
    ],
    tip: "Важно: загружай именно папку android-autoclicker, не весь архив",
  },
  {
    num: 5,
    color: "#fb5607",
    title: "Включи сборку Actions",
    emoji: "⚙️",
    substeps: [
      { text: 'Перейди во вкладку \u00ABActions\u00BB в своём репозитории', img: null },
      { text: 'Если видишь предупреждение — нажми \u00ABI understand my workflows, go ahead and enable them\u00BB', img: null },
      { text: "Сборка APK запустится автоматически — жди 15–20 минут", img: null },
    ],
    tip: "Если Actions уже запустился — просто жди",
  },
  {
    num: 6,
    color: "#ff006e",
    title: "Скачай готовый APK",
    emoji: "🎉",
    substeps: [
      { text: 'В Actions нажми на завершённую сборку (зелёная галочка ✅)', img: null },
      { text: 'Прокрути вниз до раздела \u00ABArtifacts\u00BB', img: null },
      { text: 'Нажми \u00ABAutoClicker-Pro-APK\u00BB — скачается ZIP', img: null },
      { text: "Распакуй ZIP, установи APK на телефон Android", img: null },
    ],
    tip: "Artifacts доступны 30 дней после сборки",
  },
];

export default function Index() {
  const [openStep, setOpenStep] = useState<number>(1);
  const [doneSteps, setDoneSteps] = useState<number[]>([]);

  const markDone = (num: number) => {
    setDoneSteps((prev) => prev.includes(num) ? prev : [...prev, num]);
    if (num < STEPS.length) setOpenStep(num + 1);
  };

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

        {/* ПРОГРЕСС */}
        <div className="ac-progress-bar">
          <div className="ac-progress-label">
            <span>ПРОГРЕСС</span>
            <span className="ac-progress-count" style={{ color: "#00f5ff" }}>
              {doneSteps.length}/{STEPS.length}
            </span>
          </div>
          <div className="ac-progress-track">
            <div
              className="ac-progress-fill"
              style={{ width: `${(doneSteps.length / STEPS.length) * 100}%` }}
            />
          </div>
          {doneSteps.length === STEPS.length && (
            <div className="ac-progress-done">
              🎉 APK готов к установке!
            </div>
          )}
        </div>

        {/* ШАГИ */}
        <div className="ac-steps">
          {STEPS.map((step) => {
            const isOpen = openStep === step.num;
            const isDone = doneSteps.includes(step.num);

            return (
              <div
                key={step.num}
                className={`ac-step ${isOpen ? "ac-step-open" : ""} ${isDone ? "ac-step-done" : ""}`}
                style={{ "--step-color": step.color } as React.CSSProperties}
              >
                {/* ЗАГОЛОВОК ШАГА */}
                <div
                  className="ac-step-header"
                  onClick={() => setOpenStep(isOpen ? 0 : step.num)}
                >
                  <div
                    className="ac-step-badge"
                    style={isDone
                      ? { background: "#00ff88", color: "#001a05" }
                      : { background: `${step.color}22`, color: step.color, border: `1px solid ${step.color}55` }
                    }
                  >
                    {isDone ? "✓" : step.num}
                  </div>
                  <span className="ac-step-emoji">{step.emoji}</span>
                  <div className="ac-step-title" style={isDone ? { color: "#6b9a7a" } : {}}>
                    {step.title}
                  </div>
                  <Icon
                    name={isOpen ? "ChevronUp" : "ChevronDown"}
                    size={16}
                  />
                </div>

                {/* СОДЕРЖИМОЕ */}
                {isOpen && (
                  <div className="ac-step-body">
                    <div className="ac-substeps">
                      {step.substeps.map((sub, si) => (
                        <div key={si} className="ac-substep">
                          <div className="ac-substep-num" style={{ color: step.color }}>
                            {si + 1}
                          </div>
                          <div className="ac-substep-content">
                            <span>{sub.text}</span>
                            {"link" in sub && sub.link && (
                              <a
                                href={sub.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ac-substep-link"
                                style={{ borderColor: `${step.color}66`, color: step.color, background: `${step.color}11` }}
                              >
                                <Icon name="ExternalLink" size={12} />
                                {sub.linkText}
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {step.tip && (
                      <div className="ac-substep-tip" style={{ borderColor: `${step.color}44`, background: `${step.color}08`, color: step.color }}>
                        <Icon name="Lightbulb" size={13} />
                        <span>{step.tip}</span>
                      </div>
                    )}

                    <button
                      className="ac-step-done-btn"
                      style={{ background: `${step.color}22`, borderColor: `${step.color}66`, color: step.color }}
                      onClick={() => markDone(step.num)}
                    >
                      <Icon name="Check" size={16} />
                      <span>Готово, следующий шаг →</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ФИНАЛЬНЫЙ БЛОК */}
        {doneSteps.length === STEPS.length && (
          <div className="ac-final">
            <div className="ac-final-glow" />
            <div className="ac-final-emoji">🚀</div>
            <div className="ac-final-title">AutoClicker Pro установлен!</div>
            <div className="ac-final-steps">
              <div className="ac-final-step">Открой приложение</div>
              <div className="ac-final-arrow">→</div>
              <div className="ac-final-step">Установи точки</div>
              <div className="ac-final-arrow">→</div>
              <div className="ac-final-step">Нажми Старт</div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

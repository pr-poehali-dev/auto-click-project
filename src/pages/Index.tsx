import { useState } from "react";
import Icon from "@/components/ui/icon";

const FEATURES = [
  {
    icon: "Crosshair",
    color: "#00f5ff",
    title: "Точечные касания",
    desc: "Кликер нажимает только в указанную точку. Джойстик, кнопки атаки и другие зоны экрана работают как обычно — кликер им не мешает.",
  },
  {
    icon: "Layers",
    color: "#ffbe0b",
    title: "Несколько точек",
    desc: "Можно добавить до 10 точек одновременно. Например: одна точка собирает ресурсы, другая нажимает кнопку атаки.",
  },
  {
    icon: "Zap",
    color: "#8338ec",
    title: "Скорость 1–50 кликов/сек",
    desc: "Слайдер регулирует частоту. 1 клик в секунду — медленный фарм. 50 — максимальная скорость для быстрых действий.",
  },
  {
    icon: "Timer",
    color: "#00ff88",
    title: "Задержка между кликами",
    desc: "Дополнительная пауза от 0 до 500 мс между каждым кликом. Помогает обойти защиту от ботов в некоторых играх.",
  },
  {
    icon: "Clock",
    color: "#ff006e",
    title: "Автостоп по времени",
    desc: "Задай время работы: например 5 минут — и кликер сам остановится. Удобно чтобы не держать телефон всё время.",
  },
  {
    icon: "Hash",
    color: "#3a86ff",
    title: "Автостоп по количеству",
    desc: "Кликер остановится после нужного числа кликов. Нужно нажать ровно 100 раз — задай это в настройках.",
  },
  {
    icon: "Eye",
    color: "#fb5607",
    title: "Работает поверх игры",
    desc: "После запуска можно открыть игру — кликер продолжает работать поверх неё невидимо. Настройки доступны в любой момент.",
  },
  {
    icon: "ToggleLeft",
    color: "#00f5ff",
    title: "Вкл/выкл каждой точки",
    desc: "Каждую точку можно отключить отдельно не удаляя её. Удобно когда нужно временно убрать одно из нажатий.",
  },
  {
    icon: "BarChart2",
    color: "#ffbe0b",
    title: "Статистика в реальном времени",
    desc: "Показывает сколько кликов сделано, реальный CPS (кликов в секунду) и время работы прямо во время работы кликера.",
  },
  {
    icon: "Save",
    color: "#8338ec",
    title: "Сохранение настроек",
    desc: "Все точки и настройки сохраняются после закрытия приложения. При следующем запуске всё на месте — настраивать заново не нужно.",
  },
  {
    icon: "Shuffle",
    color: "#00ff88",
    title: "Режимы: повтор / по очереди",
    desc: "Повтор — все точки нажимаются одновременно. По очереди — точки нажимаются поочерёдно одна за другой.",
  },
  {
    icon: "Smartphone",
    color: "#ff006e",
    title: "Настройка прямо в игре",
    desc: "Не нужно выходить из игры. Кликер работает как overlay — переключаешься в него, меняешь настройки, возвращаешься в игру.",
  },
];

const STEPS = [
  {
    num: 1, color: "#00f5ff", emoji: "📥",
    title: "Скачай файлы автокликера",
    desc: "Нажми кнопку «Скачать код» прямо на этой странице (кнопка выше). Сохрани ZIP-архив.",
    detail: "В скачанном архиве найди папку android-autoclicker — именно её нужно будет загрузить на GitHub.",
  },
  {
    num: 2, color: "#ffbe0b", emoji: "🐙",
    title: "Создай аккаунт на GitHub",
    desc: "GitHub — бесплатный сервис для хранения кода. Он будет собирать APK автоматически.",
    detail: "Зайди на github.com → Sign up → введи email, придумай пароль и имя пользователя. Подтверди email. Всё бесплатно.",
    link: "https://github.com/signup", linkText: "Зарегистрироваться на GitHub",
  },
  {
    num: 3, color: "#8338ec", emoji: "📁",
    title: "Создай новый репозиторий",
    desc: "Репозиторий — это папка на GitHub куда ты загрузишь файлы кликера.",
    detail: 'Нажми кнопку ниже → откроется форма → в поле "Repository name" напиши autoclicker → выбери Public → нажми зелёную кнопку "Create repository".',
    link: "https://github.com/new", linkText: "Создать репозиторий",
  },
  {
    num: 4, color: "#00ff88", emoji: "📤",
    title: "Загрузи файлы в репозиторий",
    desc: "Теперь нужно загрузить папку android-autoclicker в созданный репозиторий.",
    detail: 'На странице репозитория нажми синюю ссылку "uploading an existing file" → перетащи папку android-autoclicker или нажми "choose your files" → прокрути вниз → нажми "Commit changes".',
  },
  {
    num: 5, color: "#fb5607", emoji: "⚙️",
    title: "Включи автосборку APK",
    desc: "GitHub Actions — бесплатный инструмент который соберёт APK автоматически после загрузки файлов.",
    detail: 'Перейди во вкладку "Actions" в репозитории → если видишь предупреждение нажми "I understand my workflows, go ahead and enable them" → сборка запустится сама. Жди 15–20 минут.',
  },
  {
    num: 6, color: "#ff006e", emoji: "🎉",
    title: "Скачай и установи APK",
    desc: "После сборки APK-файл появится в разделе Artifacts — скачай и установи на телефон.",
    detail: 'Actions → нажми на сборку с зелёной галочкой ✅ → прокрути вниз до "Artifacts" → скачай "AutoClicker-Pro-APK" → распакуй ZIP → установи APK. При первом запуске разреши "Поверх других приложений".',
  },
];

export default function Index() {
  const [tab, setTab] = useState<"features" | "guide" | "faq">("features");
  const [openStep, setOpenStep] = useState<number>(1);
  const [doneSteps, setDoneSteps] = useState<number[]>([]);

  const markDone = (num: number) => {
    setDoneSteps((prev) => prev.includes(num) ? prev : [...prev, num]);
    if (num < STEPS.length) setOpenStep(num + 1);
  };

  const progress = Math.round((doneSteps.length / STEPS.length) * 100);

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
          <Icon name="Smartphone" size={12} />
          <span>Android</span>
        </div>
      </header>

      <main className="ac-main ac-main-guide">

        {/* HERO */}
        <div className="ac-hero2">
          <div className="ac-hero2-text">
            <div className="ac-hero2-tag">АВТОКЛИКЕР ДЛЯ ANDROID</div>
            <h1 className="ac-hero2-title">
              Нажимает за тебя<br />
              <span className="ac-hero2-accent">прямо в игре</span>
            </h1>
            <p className="ac-hero2-desc">
              Работает поверх любых игр и приложений. Ставишь точку — он нажимает. Джойстик и другие кнопки работают как обычно.
            </p>
          </div>

          {/* КНОПКА СКАЧАТЬ */}
          <div className="ac-download-block">
            <div className="ac-download-title">
              <Icon name="Download" size={16} />
              <span>КАК ПОЛУЧИТЬ APK</span>
            </div>
            <div className="ac-download-desc">
              APK собирается бесплатно через GitHub. Нужно скачать код, загрузить на GitHub — он сам соберёт APK за 15 минут.
            </div>
            <div className="ac-download-btns">
              <a
                href="https://github.com/new"
                target="_blank"
                rel="noopener noreferrer"
                className="ac-dl-btn-primary"
              >
                <Icon name="Github" size={18} />
                <span>Начать → GitHub</span>
              </a>
              <button
                className="ac-dl-btn-secondary"
                onClick={() => setTab("guide")}
              >
                <Icon name="BookOpen" size={16} />
                <span>Пошаговая инструкция</span>
              </button>
            </div>
            <div className="ac-download-note">
              <Icon name="Info" size={12} />
              <span>Сначала скачай код: в меню сайта нажми <b>⋮ → Скачать → Скачать код</b></span>
            </div>
          </div>
        </div>

        {/* ТАБЫ */}
        <div className="ac-tabs">
          {([
            { id: "features", label: "Функции", icon: "Zap" },
            { id: "guide", label: "Инструкция", icon: "BookOpen" },
            { id: "faq", label: "FAQ", icon: "HelpCircle" },
          ] as const).map((t) => (
            <button
              key={t.id}
              className={`ac-tab ${tab === t.id ? "ac-tab-active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <Icon name={t.icon} size={14} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ФУНКЦИИ */}
        {tab === "features" && (
          <div className="ac-features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="ac-feat-card" style={{ "--fc": f.color } as React.CSSProperties}>
                <div className="ac-feat-icon" style={{ background: `${f.color}18`, color: f.color }}>
                  <Icon name={f.icon} size={20} />
                </div>
                <div className="ac-feat-body">
                  <div className="ac-feat-title" style={{ color: f.color }}>{f.title}</div>
                  <div className="ac-feat-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ИНСТРУКЦИЯ */}
        {tab === "guide" && (
          <div className="ac-guide">
            {/* прогресс */}
            <div className="ac-prog">
              <div className="ac-prog-row">
                <span className="ac-prog-label">ПРОГРЕСС</span>
                <span className="ac-prog-val">{doneSteps.length} / {STEPS.length} шагов</span>
              </div>
              <div className="ac-prog-track">
                <div className="ac-prog-fill" style={{ width: `${progress}%` }} />
              </div>
              {doneSteps.length === STEPS.length && (
                <div className="ac-prog-complete">🎉 Все шаги выполнены — APK готов!</div>
              )}
            </div>

            <div className="ac-steps">
              {STEPS.map((step) => {
                const isOpen = openStep === step.num;
                const isDone = doneSteps.includes(step.num);
                return (
                  <div
                    key={step.num}
                    className={`ac-step ${isOpen ? "ac-step-open" : ""}`}
                    style={{ "--step-color": step.color } as React.CSSProperties}
                  >
                    <div className="ac-step-header" onClick={() => setOpenStep(isOpen ? 0 : step.num)}>
                      <div className="ac-step-badge" style={
                        isDone
                          ? { background: "#00ff88", color: "#001205", border: "none" }
                          : { background: `${step.color}18`, color: step.color, border: `1px solid ${step.color}44` }
                      }>
                        {isDone ? <Icon name="Check" size={14} /> : step.num}
                      </div>
                      <span className="ac-step-emoji">{step.emoji}</span>
                      <div className="ac-step-title">{step.title}</div>
                      <Icon name={isOpen ? "ChevronUp" : "ChevronDown"} size={15} />
                    </div>

                    {isOpen && (
                      <div className="ac-step-body">
                        <p className="ac-step-desc">{step.desc}</p>
                        <div className="ac-step-detail">{step.detail}</div>

                        {"link" in step && step.link && (
                          <a
                            href={step.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ac-step-link"
                            style={{ color: step.color, borderColor: `${step.color}55`, background: `${step.color}10` }}
                          >
                            <Icon name="ExternalLink" size={14} />
                            {step.linkText}
                          </a>
                        )}

                        <button
                          className="ac-step-btn"
                          style={{ color: step.color, borderColor: `${step.color}55`, background: `${step.color}10` }}
                          onClick={() => markDone(step.num)}
                        >
                          <Icon name="CheckCircle" size={16} />
                          <span>Сделано — следующий шаг</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FAQ */}
        {tab === "faq" && (
          <div className="ac-faq">
            {[
              {
                q: "Это работает на моём телефоне?",
                a: "Работает на любом Android 8.0 и новее. iPhone (iOS) не поддерживается — Apple запрещает такие приложения.",
              },
              {
                q: "Почему нужен GitHub, нельзя просто скачать APK?",
                a: "APK нужно скомпилировать специально для Android — этот процесс занимает 15 минут и требует мощный сервер. GitHub предоставляет такой сервер бесплатно.",
              },
              {
                q: "Кликер мешает управлению в игре?",
                a: "Нет. Кликер нажимает только в строго указанную точку. Все остальные касания — джойстик, кнопки атаки, прыжки — работают как обычно.",
              },
              {
                q: "Могут ли меня забанить в игре?",
                a: "Теоретически возможно если игра имеет защиту от ботов. Рекомендуем включить случайную задержку в настройках — это делает клики менее похожими на бота.",
              },
              {
                q: "Работает ли кликер когда телефон заблокирован?",
                a: "Нет — Android не позволяет имитировать касания на заблокированном экране. Экран должен быть включён. Советуем отключить автоблокировку на время использования.",
              },
              {
                q: "Сколько точек можно добавить?",
                a: "До 10 точек одновременно. Каждую можно включать и выключать отдельно, задавать свою задержку перед нажатием.",
              },
            ].map((item, i) => (
              <div key={i} className="ac-faq-item">
                <div className="ac-faq-q">
                  <Icon name="HelpCircle" size={15} />
                  <span>{item.q}</span>
                </div>
                <div className="ac-faq-a">{item.a}</div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}

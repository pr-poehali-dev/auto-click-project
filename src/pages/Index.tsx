import { useState } from "react";
import Icon from "@/components/ui/icon";

const DOWNLOAD_URL = "https://functions.poehali.dev/d212e3bf-6858-4aa8-b2a5-cc335fe36654";
const DEMO_IMG = "https://cdn.poehali.dev/projects/0779d2c0-90a9-4e4d-8141-2591dc0fc793/files/54d0cbb8-bba9-404f-810e-0330fd5cb6aa.jpg";

const FEATURES = [
  { icon: "Crosshair", color: "#00f5ff", title: "Точечные касания", desc: "Нажимает только в указанную точку. Джойстик, кнопки атаки и всё остальное работают как обычно — кликер не мешает." },
  { icon: "Layers", color: "#ffbe0b", title: "До 10 точек сразу", desc: "Добавь несколько точек — например одна собирает ресурсы, другая нажимает атаку. Все работают одновременно." },
  { icon: "Zap", color: "#8338ec", title: "Скорость 1–50 кл/сек", desc: "Слайдер регулирует частоту. 1 клик/сек — медленный фарм. 50 — максимальная скорость." },
  { icon: "Timer", color: "#00ff88", title: "Задержка между кликами", desc: "Дополнительная пауза 0–500 мс. Помогает обойти защиту от ботов в некоторых играх." },
  { icon: "Clock", color: "#ff006e", title: "Автостоп по времени", desc: "Задай сколько минут работать — кликер остановится сам. Не нужно следить." },
  { icon: "Hash", color: "#3a86ff", title: "Автостоп по количеству", desc: "Нужно нажать ровно 500 раз? Задай число — кликер остановится точно когда надо." },
  { icon: "Eye", color: "#fb5607", title: "Поверх любых игр", desc: "После запуска открывай игру — кликер продолжает работать сверху невидимо. Настройки доступны в любой момент." },
  { icon: "Shuffle", color: "#00f5ff", title: "Случайная задержка", desc: "Рандомизирует паузу между кликами. Делает поведение похожим на человека — сложнее обнаружить бота." },
  { icon: "Move", color: "#ffbe0b", title: "Случайное смещение", desc: "Слегка сдвигает точку клика каждый раз. Дополнительная защита от обнаружения." },
  { icon: "BarChart2", color: "#8338ec", title: "Статистика live", desc: "Кликов всего, реальный CPS и время работы — всё в реальном времени прямо во время работы." },
  { icon: "Save", color: "#00ff88", title: "Сохранение настроек", desc: "Все точки и настройки сохраняются. При следующем запуске всё на месте — настраивать заново не нужно." },
  { icon: "Smartphone", color: "#ff006e", title: "Настройка в игре", desc: "Не нужно выходить из игры. Переключись в кликер, измени что нужно — вернись обратно." },
];

const STEPS = [
  { num: 1, color: "#00f5ff", emoji: "📥", title: "Скачай файлы", desc: "Нажми кнопку «Скачать файлы» выше — ZIP скачается автоматически прямо сейчас.", detail: "В архиве будет папка android-autoclicker со всем необходимым. Сохрани на компьютер или телефон." },
  { num: 2, color: "#ffbe0b", emoji: "🐙", title: "Войди на GitHub", desc: "GitHub — бесплатный сервис. Он соберёт APK за тебя автоматически.", detail: "Зайди на github.com → Sign up → введи email и пароль. Регистрация бесплатная, занимает 2 минуты.", link: "https://github.com/signup", linkText: "Зарегистрироваться" },
  { num: 3, color: "#8338ec", emoji: "📁", title: "Создай репозиторий", desc: "Репозиторий — это папка на GitHub куда загрузишь файлы кликера.", detail: 'Нажми кнопку ниже → в поле "Repository name" напиши autoclicker → выбери Public → нажми зелёную "Create repository".', link: "https://github.com/new", linkText: "Создать репозиторий" },
  { num: 4, color: "#00ff88", emoji: "📤", title: "Загрузи папку", desc: "Загрузи папку android-autoclicker из скачанного ZIP в репозиторий.", detail: 'На странице репозитория нажми синюю ссылку "uploading an existing file" → перетащи папку android-autoclicker → нажми "Commit changes".' },
  { num: 5, color: "#fb5607", emoji: "⚙️", title: "Запусти сборку", desc: "GitHub сам соберёт APK — нужно только включить Actions.", detail: 'Вкладка "Actions" в репозитории → если видишь предупреждение нажми "I understand my workflows, go ahead and enable them" → сборка запустится, жди 15–20 мин.' },
  { num: 6, color: "#ff006e", emoji: "🎉", title: "Скачай APK", desc: "Готово! APK появится в разделе Artifacts.", detail: 'Actions → нажми на сборку с ✅ → прокрути вниз до "Artifacts" → скачай "AutoClicker-Pro-APK" → распакуй ZIP → установи APK на телефон. При первом запуске разреши "Поверх других приложений".' },
];

export default function Index() {
  const [tab, setTab] = useState<"features" | "guide" | "faq">("features");
  const [openStep, setOpenStep] = useState<number>(1);
  const [doneSteps, setDoneSteps] = useState<number[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const markDone = (num: number) => {
    setDoneSteps((p) => p.includes(num) ? p : [...p, num]);
    if (num < STEPS.length) setOpenStep(num + 1);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(DOWNLOAD_URL);
      if (!res.ok) throw new Error("error");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "AutoClicker-Pro-Source.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setTab("guide");
      setOpenStep(2);
    } catch {
      window.open(DOWNLOAD_URL, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  const progress = Math.round((doneSteps.length / STEPS.length) * 100);

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
          <Icon name="Smartphone" size={12} />
          <span>Android</span>
        </div>
      </header>

      <main className="ac-main ac-main-guide">

        {/* HERO */}
        <div className="ac-hero2">
          <div className="ac-hero2-tag">АВТОКЛИКЕР ДЛЯ ANDROID · БЕСПЛАТНО</div>
          <h1 className="ac-hero2-title">
            Нажимает за тебя<br />
            <span className="ac-hero2-accent">прямо в игре</span>
          </h1>
          <p className="ac-hero2-desc">
            Работает поверх любых игр. Ставишь точку — он нажимает. Джойстик и кнопки управления работают как обычно.
          </p>

          {/* ДЕМО */}
          <div className="ac-demo-block" onClick={() => setShowDemo(!showDemo)}>
            <img
              src={DEMO_IMG}
              alt="AutoClicker Pro демонстрация"
              className="ac-demo-img"
            />
            <div className="ac-demo-overlay">
              <div className="ac-demo-play">
                <Icon name={showDemo ? "X" : "Play"} size={20} />
                <span>{showDemo ? "Скрыть" : "Как это выглядит"}</span>
              </div>
            </div>
          </div>

          {/* КНОПКА СКАЧАТЬ */}
          <div className="ac-download-block">
            <div className="ac-download-title">
              <Icon name="Package" size={15} />
              <span>ШАГ 1 — СКАЧАЙ ФАЙЛЫ ДЛЯ СБОРКИ APK</span>
            </div>
            <div className="ac-download-desc">
              Нажми кнопку — ZIP скачается сразу. Потом загрузишь на GitHub и он сам соберёт APK за 15 минут.
            </div>

            <button
              className={`ac-dl-btn-primary ${downloading ? "ac-dl-loading" : ""}`}
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <>
                  <Icon name="Loader" size={18} />
                  <span>Скачивается...</span>
                </>
              ) : (
                <>
                  <Icon name="Download" size={20} />
                  <span>Скачать файлы автокликера</span>
                  <span className="ac-dl-size">~12 KB</span>
                </>
              )}
            </button>

            <div className="ac-dl-after">
              <div className="ac-dl-step">
                <span className="ac-dl-num" style={{ color: "#00f5ff" }}>1</span>
                <span>Скачай ZIP выше</span>
              </div>
              <Icon name="ArrowRight" size={14} />
              <div className="ac-dl-step">
                <span className="ac-dl-num" style={{ color: "#ffbe0b" }}>2</span>
                <span>Загрузи на GitHub</span>
              </div>
              <Icon name="ArrowRight" size={14} />
              <div className="ac-dl-step">
                <span className="ac-dl-num" style={{ color: "#00ff88" }}>3</span>
                <span>Получи APK</span>
              </div>
            </div>

            <button className="ac-dl-btn-secondary" onClick={() => setTab("guide")}>
              <Icon name="BookOpen" size={14} />
              <span>Подробная инструкция по шагам →</span>
            </button>
          </div>
        </div>

        {/* ТАБЫ */}
        <div className="ac-tabs">
          {([
            { id: "features", label: "Функции", icon: "Zap" },
            { id: "guide", label: "Инструкция", icon: "BookOpen" },
            { id: "faq", label: "Вопросы", icon: "HelpCircle" },
          ] as const).map((t) => (
            <button key={t.id} className={`ac-tab ${tab === t.id ? "ac-tab-active" : ""}`} onClick={() => setTab(t.id)}>
              <Icon name={t.icon} size={13} />
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
            <div className="ac-prog">
              <div className="ac-prog-row">
                <span className="ac-prog-label">ПРОГРЕСС</span>
                <span className="ac-prog-val">{doneSteps.length} / {STEPS.length}</span>
              </div>
              <div className="ac-prog-track">
                <div className="ac-prog-fill" style={{ width: `${progress}%` }} />
              </div>
              {doneSteps.length === STEPS.length && (
                <div className="ac-prog-complete">🎉 Все шаги выполнены — устанавливай APK!</div>
              )}
            </div>

            <div className="ac-steps">
              {STEPS.map((step) => {
                const isOpen = openStep === step.num;
                const isDone = doneSteps.includes(step.num);
                return (
                  <div key={step.num} className={`ac-step ${isOpen ? "ac-step-open" : ""}`}
                    style={{ "--step-color": step.color } as React.CSSProperties}>
                    <div className="ac-step-header" onClick={() => setOpenStep(isOpen ? 0 : step.num)}>
                      <div className="ac-step-badge" style={isDone
                        ? { background: "#00ff88", color: "#001205", border: "none" }
                        : { background: `${step.color}18`, color: step.color, border: `1px solid ${step.color}44` }}>
                        {isDone ? <Icon name="Check" size={13} /> : step.num}
                      </div>
                      <span className="ac-step-emoji">{step.emoji}</span>
                      <div className="ac-step-title">{step.title}</div>
                      <Icon name={isOpen ? "ChevronUp" : "ChevronDown"} size={15} />
                    </div>

                    {isOpen && (
                      <div className="ac-step-body">
                        {step.num === 1 && (
                          <button
                            className={`ac-dl-btn-primary ac-dl-inline ${downloading ? "ac-dl-loading" : ""}`}
                            onClick={handleDownload}
                            disabled={downloading}
                          >
                            {downloading
                              ? <><Icon name="Loader" size={16} /><span>Скачивается...</span></>
                              : <><Icon name="Download" size={16} /><span>Скачать AutoClicker-Pro-Source.zip</span></>
                            }
                          </button>
                        )}
                        <p className="ac-step-desc">{step.desc}</p>
                        <div className="ac-step-detail">{step.detail}</div>
                        {"link" in step && step.link && (
                          <a href={step.link} target="_blank" rel="noopener noreferrer"
                            className="ac-step-link"
                            style={{ color: step.color, borderColor: `${step.color}55`, background: `${step.color}10` }}>
                            <Icon name="ExternalLink" size={14} />
                            {step.linkText}
                          </a>
                        )}
                        <button className="ac-step-btn"
                          style={{ color: step.color, borderColor: `${step.color}55`, background: `${step.color}10` }}
                          onClick={() => markDone(step.num)}>
                          <Icon name="CheckCircle" size={15} />
                          <span>Готово — следующий шаг</span>
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
              ["Работает ли на моём телефоне?", "Работает на Android 8.0 и новее. iPhone (iOS) не поддерживается — Apple запрещает такие приложения."],
              ["Зачем нужен GitHub?", "APK нужно скомпилировать под Android — это занимает 15 минут и нужен мощный сервер. GitHub предоставляет такой сервер бесплатно."],
              ["Кликер мешает управлению в игре?", "Нет. Кликер нажимает строго в указанную точку. Джойстик, кнопки атаки и прыжки работают как обычно — кликер им не мешает."],
              ["Могут ли забанить?", "Теоретически возможно если в игре есть защита от ботов. Включи «Случайная задержка» и «Случайное смещение» — это делает клики похожими на человека."],
              ["Работает при заблокированном экране?", "Нет — Android не позволяет это. Экран должен быть включён. Советуем отключить автоблокировку на время использования."],
              ["Сколько точек можно добавить?", "До 10 точек одновременно. Каждую можно включать и выключать отдельно, настраивать задержку перед нажатием."],
              ["Нужно оставаться в приложении?", "Нет! После нажатия СТАРТ открывай любую игру — кликер работает поверх неё. Можно в любой момент вернуться и изменить настройки."],
            ].map(([q, a], i) => (
              <div key={i} className="ac-faq-item">
                <div className="ac-faq-q"><Icon name="HelpCircle" size={14} /><span>{q}</span></div>
                <div className="ac-faq-a">{a}</div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}

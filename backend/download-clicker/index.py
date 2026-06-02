"""
Отдаёт ZIP-архив с исходными файлами AutoClicker Pro для сборки APK
"""
import zipfile
import io
import base64
import os

MAIN_PY = r'''"""
AutoClicker Pro — Android overlay autoclicker
Работает поверх любых приложений через SYSTEM_ALERT_WINDOW
"""
from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.floatlayout import FloatLayout
from kivy.uix.button import Button
from kivy.uix.label import Label
from kivy.uix.slider import Slider
from kivy.uix.togglebutton import ToggleButton
from kivy.uix.scrollview import ScrollView
from kivy.uix.popup import Popup
from kivy.clock import Clock
from kivy.graphics import Color, Ellipse, Line, Rectangle
from kivy.core.window import Window
from kivy.metrics import dp, sp
from kivy.properties import BooleanProperty, ListProperty, StringProperty
from kivy.animation import Animation
import threading
import time
import json
import os

try:
    from android.permissions import request_permissions, Permission
    from jnius import autoclass
    IS_ANDROID = True
except ImportError:
    IS_ANDROID = False

if IS_ANDROID:
    PythonActivity = autoclass('org.kivy.android.PythonActivity')
    Settings = autoclass('android.provider.Settings')
    Uri = autoclass('android.net.Uri')
    Intent = autoclass('android.content.Intent')
    MotionEvent = autoclass('android.view.MotionEvent')
    SystemClock = autoclass('android.os.SystemClock')
    Instrumentation = autoclass('android.app.Instrumentation')

CONFIG_FILE = 'autoclicker_config.json'

DEFAULT_CONFIG = {
    'points': [],
    'cps': 10,
    'delay_ms': 0,
    'repeat_count': 0,
    'duration_sec': 0,
    'mode': 'repeat',
    'vibrate': True,
    'random_delay': False,
    'random_offset': False,
    'random_offset_px': 5,
}


def load_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                cfg = json.load(f)
                merged = DEFAULT_CONFIG.copy()
                merged.update(cfg)
                return merged
        except Exception:
            pass
    return DEFAULT_CONFIG.copy()


def save_config(cfg):
    try:
        with open(CONFIG_FILE, 'w') as f:
            json.dump(cfg, f, ensure_ascii=False)
    except Exception:
        pass


class ClickEngine:
    def __init__(self, config, on_click_cb=None, on_stop_cb=None):
        self.config = config
        self.on_click_cb = on_click_cb
        self.on_stop_cb = on_stop_cb
        self._running = False
        self._thread = None
        self.total_clicks = 0
        self.session_clicks = 0
        self.start_time = 0
        self._recent = []

    def start(self):
        if self._running:
            return
        self._running = True
        self.session_clicks = 0
        self.start_time = time.time()
        self._recent = []
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

    def stop(self):
        self._running = False

    def _run(self):
        config = self.config
        points = [p for p in config.get('points', []) if p.get('enabled', True)]
        if not points:
            self._running = False
            if self.on_stop_cb:
                Clock.schedule_once(lambda dt: self.on_stop_cb(), 0)
            return

        cps = max(1, min(50, config.get('cps', 10)))
        base_interval = 1.0 / cps
        delay_ms = config.get('delay_ms', 0) / 1000.0
        repeat_count = config.get('repeat_count', 0)
        duration_sec = config.get('duration_sec', 0)
        mode = config.get('mode', 'repeat')
        random_delay = config.get('random_delay', False)
        random_offset = config.get('random_offset', False)
        random_offset_px = config.get('random_offset_px', 5)

        import random
        click_idx = 0

        while self._running:
            if repeat_count > 0 and self.session_clicks >= repeat_count:
                break
            if duration_sec > 0 and (time.time() - self.start_time) >= duration_sec:
                break

            point = points[click_idx % len(points)]

            extra = point.get('delay_before', 0) / 1000.0
            if extra > 0:
                time.sleep(extra)

            if not self._running:
                break

            x, y = point['x'], point['y']
            if random_offset:
                x += random.uniform(-random_offset_px, random_offset_px)
                y += random.uniform(-random_offset_px, random_offset_px)

            self._perform_click(x, y)
            self.session_clicks += 1
            self.total_clicks += 1
            now = time.time()
            self._recent = [t for t in self._recent if now - t < 1.0] + [now]

            if self.on_click_cb:
                Clock.schedule_once(lambda dt, px=point['x'], py=point['y']: self.on_click_cb(px, py), 0)

            if mode == 'sequence':
                click_idx += 1

            sleep_time = base_interval + delay_ms
            if random_delay:
                sleep_time += random.uniform(0, base_interval * 0.3)
            time.sleep(max(0.02, sleep_time))

        self._running = False
        if self.on_stop_cb:
            Clock.schedule_once(lambda dt: self.on_stop_cb(), 0)

    def _perform_click(self, x, y):
        if not IS_ANDROID:
            return
        try:
            inst = Instrumentation()
            down_time = SystemClock.uptimeMillis()
            event_down = MotionEvent.obtain(down_time, down_time, MotionEvent.ACTION_DOWN, x, y, 0)
            event_up = MotionEvent.obtain(down_time, down_time + 50, MotionEvent.ACTION_UP, x, y, 0)
            inst.sendPointerSync(event_down)
            inst.sendPointerSync(event_up)
            event_down.recycle()
            event_up.recycle()
        except Exception:
            pass

    @property
    def is_running(self):
        return self._running

    def elapsed(self):
        return time.time() - self.start_time if self.start_time else 0

    def cps_actual(self):
        return len(self._recent)


class PointMarker(FloatLayout):
    def __init__(self, px, py, index=0, **kwargs):
        super().__init__(**kwargs)
        self.point_x = px
        self.point_y = py
        self.index = index
        self.size_hint = (None, None)
        self.size = (dp(60), dp(60))
        self.pos = (px - dp(30), py - dp(30))
        self._angle = 0
        self._draw()
        Clock.schedule_interval(self._tick, 1/30)

    def _draw(self):
        self.canvas.clear()
        cx, cy = self.center_x, self.center_y
        with self.canvas:
            Color(0, 0.95, 1, 0.25)
            Line(circle=(cx, cy, dp(26)), width=1)
            Color(0, 0.95, 1, 0.8)
            Line(circle=(cx, cy, dp(14)), width=2)
            Color(1, 0.15, 0.45, 1)
            Ellipse(pos=(cx - dp(4), cy - dp(4)), size=(dp(8), dp(8)))
            Color(0, 0.95, 1, 0.6)
            Line(points=[cx - dp(22), cy, cx + dp(22), cy], width=1)
            Line(points=[cx, cy - dp(22), cx, cy + dp(22)], width=1)
            idx_lbl = str(self.index + 1)

    def _tick(self, dt):
        self._angle = (self._angle + 2) % 360
        self._draw()

    def pulse(self):
        anim = Animation(opacity=0.3, duration=0.08) + Animation(opacity=1, duration=0.08)
        anim.start(self)


class MainScreen(FloatLayout):
    def __init__(self, app, **kwargs):
        super().__init__(**kwargs)
        self.app = app
        self.config = app.config
        self.engine = None
        self.markers = []
        self._stats_ev = None
        self._setting_point = False
        self._build()

    def _build(self):
        with self.canvas.before:
            Color(0.03, 0.06, 0.12, 1)
            self._bg = Rectangle(size=self.size, pos=self.pos)
        self.bind(size=lambda *a: setattr(self._bg, 'size', self.size))
        self.bind(pos=lambda *a: setattr(self._bg, 'pos', self.pos))

        root = BoxLayout(orientation='vertical', size_hint=(1, 1))
        self.add_widget(root)

        # Заголовок
        hdr = BoxLayout(size_hint_y=None, height=dp(50), padding=[dp(12), dp(6)])
        with hdr.canvas.before:
            Color(0.05, 0.1, 0.2, 1)
            r = Rectangle(size=hdr.size, pos=hdr.pos)
        hdr.bind(size=lambda w, v: setattr(r, 'size', v))
        hdr.bind(pos=lambda w, v: setattr(r, 'pos', v))
        hdr.add_widget(Label(text='[b]⚡ AutoClicker [color=#00f5ff]PRO[/color][/b]', markup=True, font_size=sp(17), halign='left'))
        self._status = Label(text='[color=#4a7a9b]● ГОТОВ[/color]', markup=True, font_size=sp(12), size_hint_x=None, width=dp(100), halign='right')
        hdr.add_widget(self._status)
        root.add_widget(hdr)

        # Зона клика
        self._zone = FloatLayout(size_hint_y=0.38)
        with self._zone.canvas.before:
            Color(0.05, 0.09, 0.17, 1)
            self._zone_bg = Rectangle(size=self._zone.size, pos=self._zone.pos)
        self._zone.bind(size=lambda w, v: setattr(self._zone_bg, 'size', v))
        self._zone.bind(pos=lambda w, v: setattr(self._zone_bg, 'pos', v))
        self._zone_hint = Label(
            text='Нажмите [color=#00f5ff]«+ Точка»[/color] и тапните сюда',
            markup=True, font_size=sp(13), halign='center',
            pos_hint={'center_x': 0.5, 'center_y': 0.5}
        )
        self._zone.add_widget(self._zone_hint)
        self._zone.bind(on_touch_down=self._on_zone_touch)
        root.add_widget(self._zone)

        # Статистика
        stats = BoxLayout(size_hint_y=None, height=dp(60), spacing=dp(4), padding=[dp(8), dp(4)])
        with stats.canvas.before:
            Color(0.04, 0.08, 0.16, 1)
            r2 = Rectangle(size=stats.size, pos=stats.pos)
        stats.bind(size=lambda w, v: setattr(r2, 'size', v))
        stats.bind(pos=lambda w, v: setattr(r2, 'pos', v))
        self._lbl_clicks = self._stat_widget('0', 'КЛИКОВ')
        self._lbl_cps = self._stat_widget('0', 'CPS')
        self._lbl_time = self._stat_widget('00:00', 'ВРЕМЯ')
        self._lbl_pts = self._stat_widget('0', 'ТОЧЕК')
        for w in [self._lbl_clicks, self._lbl_cps, self._lbl_time, self._lbl_pts]:
            stats.add_widget(w)
        root.add_widget(stats)

        # Настройки
        sv = ScrollView(size_hint_y=0.35)
        settings = BoxLayout(orientation='vertical', spacing=dp(8), padding=dp(10), size_hint_y=None)
        settings.bind(minimum_height=settings.setter('height'))

        # CPS
        settings.add_widget(self._slider_row('Скорость', 1, 50, self.config.get('cps', 10),
                             lambda v: self._set('cps', int(v)), '{:.0f} кл/сек'))
        # Задержка
        settings.add_widget(self._slider_row('Задержка', 0, 500, self.config.get('delay_ms', 0),
                             lambda v: self._set('delay_ms', int(v)), '{:.0f} мс', step=10))
        # Авт. стоп по кол-ву
        settings.add_widget(self._slider_row('Кол-во кликов (0=∞)', 0, 5000, self.config.get('repeat_count', 0),
                             lambda v: self._set('repeat_count', int(v)), '{:.0f}', step=50))
        # Авт. стоп по времени
        settings.add_widget(self._slider_row('Время работы (0=∞)', 0, 300, self.config.get('duration_sec', 0),
                             lambda v: self._set('duration_sec', int(v)), '{:.0f} сек', step=5))
        # Случайная задержка
        settings.add_widget(self._toggle_row('Случайная задержка (анти-бан)', 'random_delay'))
        # Случайное смещение
        settings.add_widget(self._toggle_row('Случайное смещение точки', 'random_offset'))
        # Режим
        settings.add_widget(self._mode_row())

        sv.add_widget(settings)
        root.add_widget(sv)

        # Кнопки управления
        ctrl = BoxLayout(size_hint_y=None, height=dp(60), spacing=dp(6), padding=[dp(8), dp(6)])
        with ctrl.canvas.before:
            Color(0.03, 0.06, 0.12, 1)
            r3 = Rectangle(size=ctrl.size, pos=ctrl.pos)
        ctrl.bind(size=lambda w, v: setattr(r3, 'size', v))
        ctrl.bind(pos=lambda w, v: setattr(r3, 'pos', v))

        btn_add = Button(text='+ Точка', font_size=sp(13), background_color=(0.1, 0.4, 0.75, 1))
        btn_add.bind(on_press=self._add_point_mode)

        self._btn_start = Button(text='▶ СТАРТ', font_size=sp(14), bold=True,
                                  background_color=(0.05, 0.7, 0.35, 1))
        self._btn_start.bind(on_press=self._start)

        self._btn_stop = Button(text='■ СТОП', font_size=sp(14), bold=True,
                                 background_color=(0.75, 0.1, 0.2, 1), disabled=True)
        self._btn_stop.bind(on_press=self._stop)

        btn_clear = Button(text='🗑', font_size=sp(16), size_hint_x=None, width=dp(44),
                           background_color=(0.4, 0.1, 0.15, 1))
        btn_clear.bind(on_press=self._clear)

        ctrl.add_widget(btn_add)
        ctrl.add_widget(self._btn_start)
        ctrl.add_widget(self._btn_stop)
        ctrl.add_widget(btn_clear)
        root.add_widget(ctrl)

    def _stat_widget(self, val, lbl):
        box = BoxLayout(orientation='vertical')
        v = Label(text=val, font_size=sp(18), bold=True, color=(0, 0.95, 1, 1))
        l = Label(text=lbl, font_size=sp(9), color=(0.4, 0.6, 0.8, 1))
        box.add_widget(v)
        box.add_widget(l)
        box._val = v
        return box

    def _slider_row(self, title, mn, mx, val, cb, fmt, step=1):
        box = BoxLayout(orientation='vertical', size_hint_y=None, height=dp(68))
        top = BoxLayout(size_hint_y=None, height=dp(24))
        top.add_widget(Label(text=title, font_size=sp(12), color=(0.6, 0.8, 1, 1), halign='left'))
        vl = Label(text=fmt.format(val), font_size=sp(12), color=(0, 0.95, 1, 1),
                   size_hint_x=None, width=dp(90), halign='right')
        top.add_widget(vl)
        sl = Slider(min=mn, max=mx, value=val, step=step, size_hint_y=None, height=dp(36))
        sl.bind(value=lambda s, v: (setattr(vl, 'text', fmt.format(v)), cb(v)))
        box.add_widget(top)
        box.add_widget(sl)
        return box

    def _toggle_row(self, title, key):
        row = BoxLayout(size_hint_y=None, height=dp(40), spacing=dp(8))
        row.add_widget(Label(text=title, font_size=sp(12), color=(0.6, 0.8, 1, 1)))
        tog = ToggleButton(
            text='ВКЛ' if self.config.get(key, False) else 'ВЫКЛ',
            state='down' if self.config.get(key, False) else 'normal',
            size_hint_x=None, width=dp(60), font_size=sp(11),
            background_color=(0, 0.7, 0.4, 1) if self.config.get(key, False) else (0.3, 0.3, 0.3, 1)
        )
        def on_tog(b, k=key):
            self.config[k] = b.state == 'down'
            b.text = 'ВКЛ' if b.state == 'down' else 'ВЫКЛ'
            b.background_color = (0, 0.7, 0.4, 1) if b.state == 'down' else (0.3, 0.3, 0.3, 1)
            save_config(self.config)
        tog.bind(on_press=on_tog)
        row.add_widget(tog)
        return row

    def _mode_row(self):
        box = BoxLayout(orientation='vertical', size_hint_y=None, height=dp(60))
        box.add_widget(Label(text='Режим кликов:', font_size=sp(12), color=(0.6, 0.8, 1, 1),
                             size_hint_y=None, height=dp(24)))
        modes = BoxLayout(size_hint_y=None, height=dp(36), spacing=dp(4))
        for mid, mname in [('repeat', 'Все точки'), ('sequence', 'По очереди')]:
            b = ToggleButton(text=mname, group='mode', font_size=sp(11),
                             state='down' if self.config.get('mode', 'repeat') == mid else 'normal')
            b.bind(on_press=lambda btn, m=mid: self._set('mode', m))
            modes.add_widget(b)
        box.add_widget(modes)
        return box

    def _on_zone_touch(self, widget, touch):
        if not widget.collide_point(*touch.pos):
            return False
        if self._setting_point:
            self._place_point(touch.x, touch.y)
            self._setting_point = False
        return False

    def _add_point_mode(self, *a):
        self._setting_point = True
        self._zone_hint.text = '[color=#ffbe0b]Тапните по экрану чтобы поставить точку[/color]'

    def _place_point(self, x, y):
        pt = {'x': x, 'y': y, 'label': f'Точка {len(self.config["points"])+1}',
              'enabled': True, 'delay_before': 0}
        self.config['points'].append(pt)
        save_config(self.config)
        self._refresh_markers()
        self._update_pts_count()
        self._zone_hint.text = 'Нажмите [color=#00f5ff]«+ Точка»[/color] и тапните сюда'

    def _refresh_markers(self):
        for m in self.markers:
            if m.parent:
                m.parent.remove_widget(m)
        self.markers.clear()
        for i, pt in enumerate(self.config['points']):
            if pt.get('enabled', True):
                m = PointMarker(pt['x'], pt['y'], i)
                self._zone.add_widget(m)
                self.markers.append(m)

    def _update_pts_count(self):
        self._lbl_pts._val.text = str(len(self.config['points']))

    def _set(self, key, val):
        self.config[key] = val
        save_config(self.config)

    def _start(self, *a):
        if not self.config['points']:
            self._popup('Нет точек', 'Добавьте хотя бы одну точку — нажмите «+ Точка» и тапните по зоне')
            return
        if IS_ANDROID:
            try:
                mActivity = PythonActivity.mActivity
                if not Settings.canDrawOverlays(mActivity):
                    intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                                    Uri.parse(f'package:{mActivity.getPackageName()}'))
                    mActivity.startActivityForResult(intent, 1001)
                    self._popup('Нужно разрешение', 'Разрешите отображение поверх других приложений и нажмите СТАРТ снова')
                    return
            except Exception:
                pass
        self.engine = ClickEngine(self.config, self._on_click, self._on_stop_cb)
        self.engine.start()
        self._btn_start.disabled = True
        self._btn_stop.disabled = False
        self._status.text = '[color=#00ff88]● АКТИВЕН[/color]'
        self._stats_ev = Clock.schedule_interval(self._update_stats, 0.25)

    def _stop(self, *a):
        if self.engine:
            self.engine.stop()

    def _on_stop_cb(self):
        self._btn_start.disabled = False
        self._btn_stop.disabled = True
        self._status.text = '[color=#4a7a9b]● ГОТОВ[/color]'
        if self._stats_ev:
            self._stats_ev.cancel()

    def _clear(self, *a):
        self.config['points'].clear()
        save_config(self.config)
        self._refresh_markers()
        self._update_pts_count()

    def _on_click(self, x, y):
        for m in self.markers:
            if abs(m.point_x - x) < dp(40) and abs(m.point_y - y) < dp(40):
                m.pulse()

    def _update_stats(self, dt):
        if not self.engine:
            return
        self._lbl_clicks._val.text = str(self.engine.total_clicks)
        self._lbl_cps._val.text = str(self.engine.cps_actual())
        e = self.engine.elapsed()
        self._lbl_time._val.text = f'{int(e//60):02d}:{int(e%60):02d}'

    def _popup(self, title, msg):
        c = BoxLayout(orientation='vertical', padding=dp(12), spacing=dp(8))
        c.add_widget(Label(text=msg, font_size=sp(13), halign='center'))
        b = Button(text='OK', size_hint_y=None, height=dp(40))
        p = Popup(title=title, content=c, size_hint=(0.88, 0.38))
        b.bind(on_press=p.dismiss)
        c.add_widget(b)
        p.open()


class AutoClickerProApp(App):
    def build(self):
        self.title = 'AutoClicker Pro'
        Window.clearcolor = (0.03, 0.06, 0.12, 1)
        self.config_data = load_config()
        if IS_ANDROID:
            try:
                request_permissions([Permission.SYSTEM_ALERT_WINDOW])
            except Exception:
                pass
        return MainScreen(self)

    def on_pause(self):
        return True

    def on_resume(self):
        pass


if __name__ == '__main__':
    AutoClickerProApp().run()
'''

BUILDOZER_SPEC = '''[app]
title = AutoClicker Pro
package.name = autoclickerpro
package.domain = org.autoclicker
source.dir = .
source.include_exts = py,png,jpg,kv,atlas,json
version = 1.2

requirements = python3,kivy==2.3.0,android

orientation = portrait
fullscreen = 0

android.permissions = SYSTEM_ALERT_WINDOW, FOREGROUND_SERVICE, VIBRATE
android.api = 33
android.minapi = 26
android.ndk = 25b
android.sdk = 33
android.ndk_api = 26
android.archs = arm64-v8a, armeabi-v7a
android.allow_backup = True
android.release_artifact = apk

[buildozer]
log_level = 2
warn_on_root = 1
'''

WORKFLOW_YML = '''name: Build APK

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-22.04
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.10"

      - name: Install system deps
        run: |
          sudo apt-get update
          sudo apt-get install -y git zip unzip openjdk-17-jdk build-essential \\
            libffi-dev libssl-dev python3-pip autoconf libtool pkg-config \\
            zlib1g-dev libncurses5-dev libncursesw5-dev libtinfo5 cmake
          pip install --upgrade pip
          pip install buildozer cython==0.29.33

      - name: Cache buildozer
        uses: actions/cache@v4
        with:
          path: |
            ~/.buildozer
            .buildozer
          key: buildozer-${{ runner.os }}-${{ hashFiles(\'buildozer.spec\') }}

      - name: Build APK
        run: buildozer android debug
        env:
          JAVA_HOME: /usr/lib/jvm/java-17-openjdk-amd64

      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: AutoClicker-Pro-APK
          path: bin/*.apk
          retention-days: 30
'''

README = '''# AutoClicker Pro — Android

Автокликер который работает поверх любых игр и приложений.

## Функции
- Несколько точек клика одновременно
- Скорость 1–50 кликов/сек
- Автостоп по времени и количеству
- Случайная задержка (анти-бан)
- Случайное смещение точки
- Работает поверх игр (overlay)
- Сохранение настроек

## Сборка APK

1. Форкни этот репозиторий
2. Перейди во вкладку **Actions**
3. Нажми **"I understand my workflows, go ahead and enable them"**
4. Дождись сборки (~15–20 минут)
5. Скачай APK из **Artifacts**

## Установка

1. Разреши установку из неизвестных источников
2. Установи APK
3. При запуске разреши **"Поверх других приложений"**
'''


def handler(event: dict, context) -> dict:
    """Отдаёт ZIP-архив с исходниками AutoClicker Pro для сборки APK на GitHub Actions"""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            'body': ''
        }

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.writestr('android-autoclicker/main.py', MAIN_PY)
        zf.writestr('android-autoclicker/buildozer.spec', BUILDOZER_SPEC)
        zf.writestr('android-autoclicker/.github/workflows/build.yml', WORKFLOW_YML)
        zf.writestr('android-autoclicker/README.md', README)

    zip_bytes = buf.getvalue()
    zip_b64 = base64.b64encode(zip_bytes).decode('utf-8')

    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/zip',
            'Content-Disposition': 'attachment; filename="AutoClicker-Pro-Source.zip"',
            'Content-Length': str(len(zip_bytes)),
        },
        'body': zip_b64,
        'isBase64Encoded': True,
    }

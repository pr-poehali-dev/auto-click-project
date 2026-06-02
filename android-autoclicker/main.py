"""
AutoClicker Pro — Android overlay autoclicker
Работает поверх любых приложений через Accessibility Service
"""
from kivy.app import App
from kivy.uix.widget import Widget
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
from kivy.properties import (
    NumericProperty, BooleanProperty, ListProperty, StringProperty, ObjectProperty
)
from kivy.uix.recycleview import RecycleView
from kivy.animation import Animation
import threading
import time
import json
import os

# Android-specific imports
try:
    from android.permissions import request_permissions, Permission, check_permission
    from jnius import autoclass, cast
    from android import activity
    IS_ANDROID = True
except ImportError:
    IS_ANDROID = False

if IS_ANDROID:
    PythonActivity = autoclass('org.kivy.android.PythonActivity')
    Context = autoclass('android.content.Context')
    Intent = autoclass('android.content.Intent')
    Settings = autoclass('android.provider.Settings')
    Uri = autoclass('android.net.Uri')
    WindowManager = autoclass('android.view.WindowManager')
    WindowManagerLayoutParams = autoclass('android.view.WindowManager$LayoutParams')
    PixelFormat = autoclass('android.graphics.PixelFormat')
    Gravity = autoclass('android.view.Gravity')
    MotionEvent = autoclass('android.view.MotionEvent')
    SystemClock = autoclass('android.os.SystemClock')
    Instrumentation = autoclass('android.app.Instrumentation')
    Build = autoclass('android.os.Build')
    AccessibilityManager = autoclass('android.view.accessibility.AccessibilityManager')


CONFIG_FILE = 'autoclicker_config.json'

DEFAULT_CONFIG = {
    'points': [],
    'cps': 10,
    'delay_ms': 0,
    'repeat_count': 0,
    'duration_sec': 0,
    'mode': 'repeat',
    'multi_touch': True,
    'smart_mode': False,
    'vibrate': True,
    'show_overlay': True,
}


def load_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                cfg = json.load(f)
                DEFAULT_CONFIG.update(cfg)
                return DEFAULT_CONFIG.copy()
        except Exception:
            pass
    return DEFAULT_CONFIG.copy()


def save_config(cfg):
    try:
        with open(CONFIG_FILE, 'w') as f:
            json.dump(cfg, f)
    except Exception:
        pass


class ClickPoint:
    def __init__(self, x, y, label=''):
        self.x = x
        self.y = y
        self.label = label or f'Точка {x:.0f},{y:.0f}'
        self.enabled = True
        self.delay_before = 0

    def to_dict(self):
        return {
            'x': self.x, 'y': self.y,
            'label': self.label,
            'enabled': self.enabled,
            'delay_before': self.delay_before,
        }

    @staticmethod
    def from_dict(d):
        p = ClickPoint(d['x'], d['y'], d.get('label', ''))
        p.enabled = d.get('enabled', True)
        p.delay_before = d.get('delay_before', 0)
        return p


class ClickEngine:
    """Движок кликов — работает в отдельном потоке"""

    def __init__(self, config, on_click_cb=None, on_stop_cb=None):
        self.config = config
        self.on_click_cb = on_click_cb
        self.on_stop_cb = on_stop_cb
        self._running = False
        self._thread = None
        self.total_clicks = 0
        self.session_clicks = 0
        self.start_time = 0

    def start(self):
        if self._running:
            return
        self._running = True
        self.session_clicks = 0
        self.start_time = time.time()
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

        click_idx = 0

        while self._running:
            # Проверка лимитов
            if repeat_count > 0 and self.session_clicks >= repeat_count:
                break
            if duration_sec > 0 and (time.time() - self.start_time) >= duration_sec:
                break

            point = points[click_idx % len(points)]

            # Задержка перед точкой
            extra_delay = point.get('delay_before', 0) / 1000.0
            if extra_delay > 0:
                time.sleep(extra_delay)

            if not self._running:
                break

            # Выполнить клик
            self._perform_click(point['x'], point['y'])
            self.session_clicks += 1
            self.total_clicks += 1

            if self.on_click_cb:
                Clock.schedule_once(
                    lambda dt, p=point: self.on_click_cb(p['x'], p['y']),
                    0
                )

            if mode == 'sequence':
                click_idx += 1

            # Интервал
            sleep_time = base_interval + delay_ms
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
            event_time = SystemClock.uptimeMillis()
            event_down = MotionEvent.obtain(
                down_time, event_time,
                MotionEvent.ACTION_DOWN, x, y, 0
            )
            event_up = MotionEvent.obtain(
                down_time, event_time + 50,
                MotionEvent.ACTION_UP, x, y, 0
            )
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
        if not self.start_time:
            return 0
        return time.time() - self.start_time

    def cps_actual(self):
        elapsed = self.elapsed()
        if elapsed < 0.5:
            return 0
        return self.session_clicks / elapsed


class PointMarker(Widget):
    """Визуальная метка точки клика"""
    color_active = ListProperty([0, 0.95, 1, 1])
    color_idle = ListProperty([1, 0.3, 0.5, 0.8])

    def __init__(self, px, py, index=0, **kwargs):
        super().__init__(**kwargs)
        self.point_x = px
        self.point_y = py
        self.index = index
        self.size = (dp(44), dp(44))
        self.pos = (px - dp(22), py - dp(22))
        self._anim_angle = 0
        self._draw()
        Clock.schedule_interval(self._animate, 1 / 30)

    def _draw(self):
        self.canvas.clear()
        with self.canvas:
            # Внешнее кольцо
            Color(0, 0.95, 1, 0.4)
            Line(circle=(self.center_x, self.center_y, dp(20)), width=1.5)
            # Внутреннее кольцо
            Color(0, 0.95, 1, 0.9)
            Line(circle=(self.center_x, self.center_y, dp(10)), width=2)
            # Центральная точка
            Color(1, 0.2, 0.5, 1)
            Ellipse(pos=(self.center_x - dp(4), self.center_y - dp(4)),
                    size=(dp(8), dp(8)))
            # Перекрестие
            Color(0, 0.95, 1, 0.7)
            Line(points=[self.center_x - dp(16), self.center_y,
                         self.center_x + dp(16), self.center_y], width=1)
            Line(points=[self.center_x, self.center_y - dp(16),
                         self.center_x, self.center_y + dp(16)], width=1)

    def _animate(self, dt):
        self._anim_angle = (self._anim_angle + 3) % 360
        self._draw()

    def pulse(self):
        anim = Animation(opacity=0.3, duration=0.1) + Animation(opacity=1, duration=0.1)
        anim.start(self)


class MainScreen(FloatLayout):
    """Главный экран приложения"""

    def __init__(self, app, **kwargs):
        super().__init__(**kwargs)
        self.app = app
        self.config = app.config
        self.engine = None
        self.markers = []
        self._stats_event = None
        self._build_ui()

    def _build_ui(self):
        from kivy.uix.tabbedpanel import TabbedPanel, TabbedPanelItem

        # Фон
        with self.canvas.before:
            Color(0.04, 0.07, 0.12, 1)
            self._bg_rect = Rectangle(size=self.size, pos=self.pos)
        self.bind(size=self._update_bg, pos=self._update_bg)

        # Основной контейнер
        root = BoxLayout(orientation='vertical', spacing=0)
        self.add_widget(root)

        # Заголовок
        header = self._make_header()
        root.add_widget(header)

        # Вкладки
        tabs = TabbedPanel(do_default_tab=False)
        tabs.tab_width = dp(90)

        # Вкладка: Зона
        tab_zone = TabbedPanelItem(text='Зона')
        tab_zone.add_widget(self._make_zone_tab())
        tabs.add_widget(tab_zone)

        # Вкладка: Точки
        tab_points = TabbedPanelItem(text='Точки')
        self._points_layout = self._make_points_tab()
        tab_points.add_widget(self._points_layout)
        tabs.add_widget(tab_points)

        # Вкладка: Настройки
        tab_settings = TabbedPanelItem(text='Настройки')
        tab_settings.add_widget(self._make_settings_tab())
        tabs.add_widget(tab_settings)

        # Вкладка: Статистика
        tab_stats = TabbedPanelItem(text='Статы')
        self._stats_tab = self._make_stats_tab()
        tab_stats.add_widget(self._stats_tab)
        tabs.add_widget(tab_stats)

        root.add_widget(tabs)

        # Нижняя панель управления
        controls = self._make_controls()
        root.add_widget(controls)

    def _update_bg(self, *args):
        self._bg_rect.size = self.size
        self._bg_rect.pos = self.pos

    def _make_header(self):
        h = BoxLayout(
            orientation='horizontal',
            size_hint_y=None,
            height=dp(52),
            padding=[dp(12), dp(8)],
            spacing=dp(8),
        )
        with h.canvas.before:
            Color(0.06, 0.12, 0.22, 1)
            self._h_rect = Rectangle(size=h.size, pos=h.pos)
        h.bind(size=lambda w, v: setattr(self._h_rect, 'size', v))
        h.bind(pos=lambda w, v: setattr(self._h_rect, 'pos', v))

        lbl = Label(
            text='⚡ AUTO[color=#00f5ff]CLICKER[/color] PRO',
            markup=True,
            font_size=sp(18),
            bold=True,
            halign='left',
            size_hint_x=0.7,
        )
        h.add_widget(lbl)

        self._status_lbl = Label(
            text='[color=#4a7a9b]● ГОТОВ[/color]',
            markup=True,
            font_size=sp(12),
            halign='right',
            size_hint_x=0.3,
        )
        h.add_widget(self._status_lbl)
        return h

    def _make_zone_tab(self):
        layout = FloatLayout()

        with layout.canvas.before:
            Color(0.06, 0.1, 0.18, 1)
            Rectangle(size=layout.size, pos=layout.pos)

        hint = Label(
            text='Нажмите на экран, чтобы\n[color=#00f5ff]установить точку клика[/color]',
            markup=True,
            font_size=sp(15),
            halign='center',
            size_hint=(None, None),
            size=(dp(280), dp(60)),
            pos_hint={'center_x': 0.5, 'center_y': 0.75},
        )
        layout.add_widget(hint)

        self._zone_hint = hint
        self._zone_layout = layout
        layout.bind(on_touch_down=self._on_zone_touch)

        # Метки точек
        self._refresh_markers()
        return layout

    def _on_zone_touch(self, widget, touch):
        if not self._zone_layout.collide_point(*touch.pos):
            return False
        if self.app.setting_point:
            self._add_point(touch.x, touch.y)
            self.app.setting_point = False
            self._zone_hint.text = 'Нажмите на экран, чтобы\n[color=#00f5ff]установить точку клика[/color]'
        return False

    def _add_point(self, x, y):
        point = {'x': x, 'y': y, 'label': f'Точка {len(self.config["points"]) + 1}',
                 'enabled': True, 'delay_before': 0}
        self.config['points'].append(point)
        save_config(self.config)
        self._refresh_markers()
        self._refresh_points_list()

    def _refresh_markers(self):
        for m in self.markers:
            if m.parent:
                m.parent.remove_widget(m)
        self.markers.clear()

        for i, pt in enumerate(self.config['points']):
            if pt.get('enabled', True):
                marker = PointMarker(pt['x'], pt['y'], index=i)
                self._zone_layout.add_widget(marker)
                self.markers.append(marker)

    def _make_points_tab(self):
        layout = BoxLayout(orientation='vertical', spacing=dp(6), padding=dp(8))

        top = BoxLayout(size_hint_y=None, height=dp(44), spacing=dp(6))

        btn_add = Button(
            text='+ Добавить точку',
            background_color=(0, 0.6, 0.8, 1),
            color=(1, 1, 1, 1),
            font_size=sp(13),
        )
        btn_add.bind(on_press=self._start_add_point)
        top.add_widget(btn_add)

        btn_clear = Button(
            text='🗑 Очистить',
            background_color=(0.7, 0.1, 0.2, 1),
            color=(1, 1, 1, 1),
            font_size=sp(13),
            size_hint_x=0.4,
        )
        btn_clear.bind(on_press=self._clear_points)
        top.add_widget(btn_clear)

        layout.add_widget(top)

        self._points_scroll = ScrollView()
        self._points_list_box = BoxLayout(
            orientation='vertical',
            spacing=dp(4),
            size_hint_y=None,
        )
        self._points_list_box.bind(minimum_height=self._points_list_box.setter('height'))
        self._points_scroll.add_widget(self._points_list_box)
        layout.add_widget(self._points_scroll)

        self._refresh_points_list()
        return layout

    def _start_add_point(self, *args):
        self.app.setting_point = True
        self._zone_hint.text = '[color=#ffbe0b]Перейдите на вкладку «Зона»\nи нажмите точку на экране[/color]'

    def _clear_points(self, *args):
        self.config['points'].clear()
        save_config(self.config)
        self._refresh_markers()
        self._refresh_points_list()

    def _refresh_points_list(self):
        self._points_list_box.clear_widgets()
        for i, pt in enumerate(self.config['points']):
            row = self._make_point_row(i, pt)
            self._points_list_box.add_widget(row)

    def _make_point_row(self, idx, pt):
        row = BoxLayout(
            orientation='horizontal',
            size_hint_y=None,
            height=dp(52),
            spacing=dp(6),
            padding=[dp(6), dp(4)],
        )
        with row.canvas.before:
            Color(0.08, 0.14, 0.24, 1)
            r = Rectangle(size=row.size, pos=row.pos)
        row.bind(size=lambda w, v: setattr(r, 'size', v))
        row.bind(pos=lambda w, v: setattr(r, 'pos', v))

        # Номер и координаты
        info = BoxLayout(orientation='vertical')
        lbl_name = Label(
            text=f'[b]{pt["label"]}[/b]',
            markup=True,
            font_size=sp(13),
            halign='left',
            valign='middle',
            size_hint_y=0.6,
        )
        lbl_coords = Label(
            text=f'X:{pt["x"]:.0f}  Y:{pt["y"]:.0f}  |  задержка: {pt.get("delay_before", 0)}мс',
            font_size=sp(10),
            color=(0.5, 0.7, 0.9, 1),
            halign='left',
            valign='middle',
            size_hint_y=0.4,
        )
        info.add_widget(lbl_name)
        info.add_widget(lbl_coords)
        row.add_widget(info)

        # Вкл/выкл
        tog = ToggleButton(
            text='ВКЛ' if pt.get('enabled', True) else 'ВЫКЛ',
            state='down' if pt.get('enabled', True) else 'normal',
            size_hint_x=None,
            width=dp(52),
            font_size=sp(11),
            background_color=(0, 0.7, 0.4, 1) if pt.get('enabled', True) else (0.4, 0.4, 0.4, 1),
        )

        def on_toggle(btn, i=idx):
            self.config['points'][i]['enabled'] = btn.state == 'down'
            btn.text = 'ВКЛ' if btn.state == 'down' else 'ВЫКЛ'
            btn.background_color = (0, 0.7, 0.4, 1) if btn.state == 'down' else (0.4, 0.4, 0.4, 1)
            save_config(self.config)
            self._refresh_markers()

        tog.bind(on_press=on_toggle)
        row.add_widget(tog)

        # Удалить
        btn_del = Button(
            text='✕',
            size_hint_x=None,
            width=dp(36),
            background_color=(0.7, 0.1, 0.2, 1),
            color=(1, 1, 1, 1),
            font_size=sp(14),
        )

        def on_del(btn, i=idx):
            self.config['points'].pop(i)
            save_config(self.config)
            self._refresh_markers()
            self._refresh_points_list()

        btn_del.bind(on_press=on_del)
        row.add_widget(btn_del)

        return row

    def _make_settings_tab(self):
        sv = ScrollView()
        layout = BoxLayout(
            orientation='vertical',
            spacing=dp(14),
            padding=dp(12),
            size_hint_y=None,
        )
        layout.bind(minimum_height=layout.setter('height'))

        # CPS
        layout.add_widget(self._make_slider_row(
            'Скорость (CPS)', 1, 50,
            self.config.get('cps', 10),
            lambda v: self._set('cps', int(v)),
            '{:.0f} кл/сек'
        ))

        # Задержка
        layout.add_widget(self._make_slider_row(
            'Задержка между кликами', 0, 500,
            self.config.get('delay_ms', 0),
            lambda v: self._set('delay_ms', int(v)),
            '{:.0f} мс', step=10
        ))

        # Количество повторов
        layout.add_widget(self._make_slider_row(
            'Кол-во кликов (0 = бесконечно)', 0, 10000,
            self.config.get('repeat_count', 0),
            lambda v: self._set('repeat_count', int(v)),
            '{:.0f}', step=50
        ))

        # Продолжительность
        layout.add_widget(self._make_slider_row(
            'Время работы (0 = бесконечно)', 0, 300,
            self.config.get('duration_sec', 0),
            lambda v: self._set('duration_sec', int(v)),
            '{:.0f} сек', step=5
        ))

        # Режим
        layout.add_widget(Label(
            text='Режим кликов:',
            font_size=sp(13),
            color=(0.7, 0.85, 1, 1),
            size_hint_y=None, height=dp(28),
            halign='left',
        ))

        mode_box = BoxLayout(size_hint_y=None, height=dp(40), spacing=dp(6))
        for mode_id, mode_name in [('repeat', 'Повтор всех'), ('sequence', 'По порядку')]:
            btn = ToggleButton(
                text=mode_name,
                group='mode',
                state='down' if self.config.get('mode', 'repeat') == mode_id else 'normal',
                font_size=sp(12),
            )
            btn.bind(on_press=lambda b, m=mode_id: self._set('mode', m))
            mode_box.add_widget(btn)
        layout.add_widget(mode_box)

        # Вибрация
        vib_row = BoxLayout(size_hint_y=None, height=dp(40), spacing=dp(8))
        vib_row.add_widget(Label(
            text='Вибрация при клике:',
            font_size=sp(13),
            color=(0.7, 0.85, 1, 1),
        ))
        vib_tog = ToggleButton(
            text='ВКЛ' if self.config.get('vibrate', True) else 'ВЫКЛ',
            state='down' if self.config.get('vibrate', True) else 'normal',
            size_hint_x=None, width=dp(70),
            font_size=sp(12),
        )
        vib_tog.bind(on_press=lambda b: self._set('vibrate', b.state == 'down'))
        vib_row.add_widget(vib_tog)
        layout.add_widget(vib_row)

        sv.add_widget(layout)
        return sv

    def _make_slider_row(self, title, mn, mx, val, cb, fmt='{:.0f}', step=1):
        box = BoxLayout(orientation='vertical', size_hint_y=None, height=dp(72), spacing=dp(2))

        top = BoxLayout(size_hint_y=None, height=dp(24))
        lbl = Label(text=title, font_size=sp(12), color=(0.7, 0.85, 1, 1), halign='left')
        val_lbl = Label(
            text=fmt.format(val),
            font_size=sp(12),
            color=(0, 0.95, 1, 1),
            size_hint_x=None, width=dp(80),
            halign='right',
        )
        top.add_widget(lbl)
        top.add_widget(val_lbl)

        slider = Slider(min=mn, max=mx, value=val, step=step, size_hint_y=None, height=dp(36))
        slider.bind(value=lambda s, v: (val_lbl.setter('text')(val_lbl, fmt.format(v)), cb(v)))

        box.add_widget(top)
        box.add_widget(slider)
        return box

    def _make_stats_tab(self):
        layout = BoxLayout(orientation='vertical', spacing=dp(12), padding=dp(16))

        self._stat_clicks = self._stat_card('ВСЕГО КЛИКОВ', '0')
        self._stat_cps = self._stat_card('CPS СЕЙЧАС', '0')
        self._stat_time = self._stat_card('ВРЕМЯ РАБОТЫ', '00:00')
        self._stat_points = self._stat_card('ТОЧЕК', str(len(self.config['points'])))

        layout.add_widget(self._stat_clicks[0])
        layout.add_widget(self._stat_cps[0])
        layout.add_widget(self._stat_time[0])
        layout.add_widget(self._stat_points[0])

        return layout

    def _stat_card(self, title, value):
        card = BoxLayout(
            orientation='vertical',
            size_hint_y=None,
            height=dp(72),
            padding=dp(10),
            spacing=dp(2),
        )
        with card.canvas.before:
            Color(0.08, 0.14, 0.24, 1)
            r = Rectangle(size=card.size, pos=card.pos)
        card.bind(size=lambda w, v: setattr(r, 'size', v))
        card.bind(pos=lambda w, v: setattr(r, 'pos', v))

        lbl_t = Label(text=title, font_size=sp(10), color=(0.5, 0.7, 0.9, 1),
                      halign='center', bold=False)
        lbl_v = Label(text=value, font_size=sp(26), color=(0, 0.95, 1, 1),
                      halign='center', bold=True)
        card.add_widget(lbl_t)
        card.add_widget(lbl_v)
        return card, lbl_v

    def _make_controls(self):
        bar = BoxLayout(
            orientation='horizontal',
            size_hint_y=None,
            height=dp(64),
            spacing=dp(8),
            padding=[dp(10), dp(8)],
        )
        with bar.canvas.before:
            Color(0.04, 0.08, 0.16, 1)
            r = Rectangle(size=bar.size, pos=bar.pos)
        bar.bind(size=lambda w, v: setattr(r, 'size', v))
        bar.bind(pos=lambda w, v: setattr(r, 'pos', v))

        self._btn_start = Button(
            text='▶  СТАРТ',
            font_size=sp(15),
            bold=True,
            background_color=(0.05, 0.75, 0.35, 1),
            color=(1, 1, 1, 1),
        )
        self._btn_start.bind(on_press=self._on_start)

        self._btn_stop = Button(
            text='■  СТОП',
            font_size=sp(15),
            bold=True,
            background_color=(0.8, 0.1, 0.2, 1),
            color=(1, 1, 1, 1),
            disabled=True,
        )
        self._btn_stop.bind(on_press=self._on_stop)

        btn_add_pt = Button(
            text='＋ Точка',
            font_size=sp(13),
            background_color=(0.1, 0.4, 0.7, 1),
            color=(1, 1, 1, 1),
            size_hint_x=0.5,
        )
        btn_add_pt.bind(on_press=self._start_add_point)

        bar.add_widget(self._btn_start)
        bar.add_widget(self._btn_stop)
        bar.add_widget(btn_add_pt)
        return bar

    def _set(self, key, value):
        self.config[key] = value
        save_config(self.config)

    def _on_start(self, *args):
        if not self.config['points']:
            self._show_popup('Нет точек', 'Сначала добавьте хотя бы одну точку на вкладке «Зона»')
            return

        if IS_ANDROID:
            self._check_permissions_and_start()
        else:
            self._start_engine()

    def _check_permissions_and_start(self):
        try:
            mActivity = PythonActivity.mActivity
            if not Settings.canDrawOverlays(mActivity):
                intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse(f'package:{mActivity.getPackageName()}')
                )
                mActivity.startActivityForResult(intent, 1001)
                self._show_popup(
                    'Нужно разрешение',
                    'Разрешите отображение поверх других приложений и нажмите Старт снова'
                )
                return
        except Exception:
            pass
        self._start_engine()

    def _start_engine(self):
        self.engine = ClickEngine(
            self.config,
            on_click_cb=self._on_click_event,
            on_stop_cb=self._on_engine_stop,
        )
        self.engine.start()
        self._btn_start.disabled = True
        self._btn_stop.disabled = False
        self._status_lbl.text = '[color=#00ff88]● АКТИВЕН[/color]'
        self._stats_event = Clock.schedule_interval(self._update_stats, 0.3)

    def _on_stop(self, *args):
        if self.engine:
            self.engine.stop()

    def _on_engine_stop(self):
        self._btn_start.disabled = False
        self._btn_stop.disabled = True
        self._status_lbl.text = '[color=#4a7a9b]● ГОТОВ[/color]'
        if self._stats_event:
            self._stats_event.cancel()

    def _on_click_event(self, x, y):
        for m in self.markers:
            if abs(m.point_x - x) < dp(30) and abs(m.point_y - y) < dp(30):
                m.pulse()

    def _update_stats(self, dt):
        if not self.engine:
            return
        self._stat_clicks[1].text = str(self.engine.total_clicks)
        self._stat_cps[1].text = f'{self.engine.cps_actual():.1f}'
        elapsed = self.engine.elapsed()
        m = int(elapsed // 60)
        s = int(elapsed % 60)
        self._stat_time[1].text = f'{m:02d}:{s:02d}'
        self._stat_points[1].text = str(len(self.config['points']))

    def _show_popup(self, title, msg):
        content = BoxLayout(orientation='vertical', padding=dp(12), spacing=dp(10))
        content.add_widget(Label(text=msg, font_size=sp(13), halign='center'))
        btn = Button(text='OK', size_hint_y=None, height=dp(40))
        popup = Popup(title=title, content=content, size_hint=(0.85, 0.4))
        btn.bind(on_press=popup.dismiss)
        content.add_widget(btn)
        popup.open()


class AutoClickerApp(App):
    setting_point = BooleanProperty(False)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.config = load_config()

    def build(self):
        Window.clearcolor = (0.04, 0.07, 0.12, 1)
        self.title = 'AutoClicker Pro'

        if IS_ANDROID:
            self._request_android_permissions()

        screen = MainScreen(self)
        return screen

    def _request_android_permissions(self):
        try:
            request_permissions([
                Permission.SYSTEM_ALERT_WINDOW,
            ])
        except Exception:
            pass

    def on_pause(self):
        return True

    def on_resume(self):
        pass


if __name__ == '__main__':
    AutoClickerApp().run()

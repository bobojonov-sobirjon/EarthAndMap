import { Link } from 'react-router-dom'

const STEPS = [
  {
    title: 'Проверьте категории',
    text: 'Вариант 1 (один слой) требует категорию. Вариант 2 (весь ZIP) создаёт istirohat, yollar, suv, qabriston сам по именам файлов. Если список категорий пустой — либо создайте слои, либо выберите вариант 2.',
    to: '/admin-panel/categories',
    action: 'Открыть категории',
  },
  {
    title: 'Создайте 4 рабочих слоя',
    text: 'Добавьте записи с такими кодами (код потом лучше не менять):',
    bullets: [
      'istirohat — Парки и рекреация — геометрия Polygon — цвет #27ae60',
      'yollar — Автомобильные дороги — LineString — #e67e22',
      'suv — Оросительные сети — LineString — #3498db',
      'qabriston — Кладбища — Polygon — #95a5a6',
    ],
  },
  {
    title: 'Подготовьте shapefile',
    text: 'Один слой = один год = один ZIP. В архиве должны быть файлы с одним именем:',
    bullets: [
      '.shp — геометрия',
      '.shx — индекс',
      '.dbf — атрибуты (желательно поле name)',
      '.prj — проекция (если есть, положите тоже)',
    ],
  },
  {
    title: 'Назовите файлы понятно',
    text: 'Вариант 1: один слой — один ZIP (Istirohat_2018.zip). Вариант 2: в одном ZIP несколько групп: Istrohat_boglari_2026, Qabristonlar_2026, Kanallar_2026, I_darajali_magistral_2026, buxoro_shahar_2026.',
  },
  {
    title: 'Откройте импорт',
    text: 'Вариант 1: «Слой объектов», категория, год, цвет. Вариант 2: выберите «Весь ZIP» и загрузите архив — год берётся из имени (_2026).',
    to: '/admin-panel/import',
    action: 'К форме импорта',
  },
  {
    title: 'Префикс имени',
    text: 'Если в DBF нет поля name, укажите префикс (Парк, Дорога). Система пронумерует объекты сама.',
  },
  {
    title: 'Галочка «Заменить»',
    text: 'Не включайте, если добавляете новый год. Включайте только если хотите удалить старые объекты этой категории за выбранный год и залить файл заново.',
  },
  {
    title: 'Выберите файл и загрузите',
    text: 'Нажмите «Выберите файл», укажите ZIP или GeoJSON, затем «Загрузить на карту». Дождитесь сообщения «Загружено».',
  },
  {
    title: 'Проверьте результат',
    text: 'Реестр объектов: должна появиться колонка года. Карта: ползунок года 2018–2026, слой включён в легенде.',
    to: '/admin-panel/map',
    action: 'Открыть карту',
  },
  {
    title: 'Повторите для каждого года',
    text: 'Вариант 1: каждый слой и год — отдельный ZIP. Вариант 2: можно положить все слои одного года в один архив и загрузить разом.',
  },
]

export default function AdminImportGuidePage() {
  return (
    <div className="admin-page">
      <header className="admin-page__head">
        <div>
          <p className="eyebrow">Основное</p>
          <h2>Как загрузить shapefile</h2>
          <p className="muted">Пошаговый процесс: от категории до появления слоя на карте</p>
        </div>
        <div className="admin-page__actions">
          <Link className="btn btn-ghost" to="/admin-panel/categories">Категории</Link>
          <Link className="btn btn-primary" to="/admin-panel/import">Импорт файлов</Link>
        </div>
      </header>

      <ol className="admin-process">
        {STEPS.map((s, i) => (
          <li key={s.title} className="admin-process__item">
            <span className="admin-process__num">{String(i + 1).padStart(2, '0')}</span>
            <div className="admin-process__body">
              <h3>{s.title}</h3>
              <p>{s.text}</p>
              {s.bullets && (
                <ul>
                  {s.bullets.map((b) => <li key={b}>{b}</li>)}
                </ul>
              )}
              {s.to && (
                <Link className="admin-process__link" to={s.to}>{s.action} →</Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

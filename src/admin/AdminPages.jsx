import { adminApi } from '../api/services'
import AdminCrudPage from './AdminCrudPage'

const ROLE_OPTS = [
  { value: 'admin', label: 'Администратор' },
  { value: 'specialist', label: 'Специалист' },
  { value: 'monitor', label: 'Мониторинг' },
  { value: 'observer', label: 'Наблюдатель' },
]

const STATUS_OPTS = [
  { value: 'active', label: 'Активный' },
  { value: 'construction', label: 'Строительство' },
  { value: 'damaged', label: 'Повреждён' },
  { value: 'closed', label: 'Закрыт' },
  { value: 'planned', label: 'Планируется' },
]

const SEV_OPTS = [
  { value: 'low', label: 'Низкая' },
  { value: 'medium', label: 'Средняя' },
  { value: 'high', label: 'Высокая' },
  { value: 'critical', label: 'Критическая' },
]

const ISSUE_STATUS = [
  { value: 'new', label: 'Новая' },
  { value: 'open', label: 'Открыта' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'resolved', label: 'Устранена' },
  { value: 'closed', label: 'Закрыта' },
]

const bool = (v) => (v ? 'Да' : 'Нет')

export function AdminUsersPage() {
  return (
    <AdminCrudPage
      config={{
        title: 'Пользователи',
        subtitle: 'Управление доступом и ролями',
        api: adminApi.users,
        columns: [
          { key: 'id', label: 'ID' },
          { key: 'username', label: 'Логин' },
          { key: 'email', label: 'Email' },
          { key: 'role', label: 'Роль', render: (v) => ROLE_OPTS.find((o) => o.value === v)?.label || v },
          { key: 'organization', label: 'Организация' },
          { key: 'is_active', label: 'Активен', render: bool },
          { key: 'is_superuser', label: 'Супер', render: bool },
        ],
        fields: [
          { key: 'username', label: 'Логин *' },
          { key: 'password', label: 'Пароль', type: 'password', placeholder: 'Пусто = не менять' },
          { key: 'email', label: 'Email' },
          { key: 'first_name', label: 'Имя' },
          { key: 'last_name', label: 'Фамилия' },
          { key: 'role', label: 'Роль', type: 'select', options: ROLE_OPTS },
          { key: 'organization', label: 'Организация' },
          { key: 'phone', label: 'Телефон' },
          { key: 'is_active', label: 'Активен', type: 'checkbox' },
          { key: 'is_staff', label: 'Staff', type: 'checkbox' },
          { key: 'is_superuser', label: 'Суперпользователь', type: 'checkbox' },
        ],
        defaultForm: { role: 'observer', is_active: true },
      }}
    />
  )
}

export function AdminCategoriesPage() {
  return (
    <AdminCrudPage
      config={{
        title: 'Категории слоёв',
        subtitle: 'GIS-категории объектов',
        api: {
          ...adminApi.categories,
          update: (code, data) => adminApi.categories.update(code, data),
          remove: (code) => adminApi.categories.remove(code),
        },
        idKey: 'code',
        columns: [
          { key: 'code', label: 'Код' },
          { key: 'name_ru', label: 'Название (RU)' },
          { key: 'name_uz', label: 'Название (UZ)' },
          { key: 'geometry_type', label: 'Геометрия' },
          { key: 'color', label: 'Цвет', render: (v) => <span className="admin-swatch" style={{ background: v }}>{v}</span> },
          { key: 'is_active', label: 'Активна', render: bool },
          { key: 'order', label: 'Порядок' },
        ],
        fields: [
          { key: 'code', label: 'Код *' },
          { key: 'name_uz', label: 'Название (UZ) *' },
          { key: 'name_ru', label: 'Название (RU)' },
          { key: 'geometry_type', label: 'Тип геометрии', type: 'select', options: [
            { value: 'Point', label: 'Точка' },
            { value: 'LineString', label: 'Линия' },
            { value: 'Polygon', label: 'Полигон' },
          ]},
          { key: 'color', label: 'Цвет', placeholder: '#3498db' },
          { key: 'icon', label: 'Иконка' },
          { key: 'description', label: 'Описание', type: 'textarea' },
          { key: 'order', label: 'Порядок', type: 'number' },
          { key: 'is_active', label: 'Активна', type: 'checkbox' },
        ],
        defaultForm: { geometry_type: 'Polygon', color: '#3498db', is_active: true, order: 0 },
      }}
    />
  )
}

export function AdminLandsPage() {
  return (
    <AdminCrudPage
      config={{
        title: 'Реестр объектов',
        subtitle: 'Земли общего пользования',
        api: adminApi.lands,
        columns: [
          { key: 'public_id', label: 'ID' },
          { key: 'name', label: 'Название' },
          { key: 'category_name', label: 'Категория', render: (_, r) => r.category_name || r.category },
          { key: 'status', label: 'Статус' },
          { key: 'monitoring_year', label: 'Год' },
          { key: 'area_ha', label: 'га' },
          { key: 'length_km', label: 'км' },
          { key: 'is_active', label: 'Активен', render: bool },
        ],
        fields: [
          { key: 'name', label: 'Название *' },
          { key: 'category', label: 'ID категории *', type: 'number' },
          { key: 'status', label: 'Статус', type: 'select', options: STATUS_OPTS },
          { key: 'condition', label: 'Состояние', type: 'select', options: [
            { value: 'good', label: 'Хорошее' },
            { value: 'normal', label: 'Нормальное' },
            { value: 'bad', label: 'Плохое' },
          ]},
          { key: 'road_class', label: 'Класс дороги', type: 'select', options: [
            { value: 'magistral', label: 'Магистраль' },
            { value: 'shahar', label: 'Городская' },
            { value: 'mahalliy', label: 'Местная' },
            { value: 'piyoda', label: 'Пешеходная' },
          ]},
          { key: 'address', label: 'Адрес' },
          { key: 'mahalla', label: 'Махалля' },
          { key: 'cadastral_number', label: 'Кадастр' },
          { key: 'monitoring_year', label: 'Год мониторинга', type: 'number' },
          { key: 'responsible_org', label: 'Ответственная организация' },
          { key: 'description', label: 'Описание', type: 'textarea' },
          { key: 'data_source', label: 'Источник данных' },
          { key: 'geometry', label: 'Геометрия (GeoJSON)', type: 'json', rows: 6 },
          { key: 'is_active', label: 'Активен', type: 'checkbox' },
        ],
        defaultForm: { status: 'active', condition: 'normal', is_active: true, monitoring_year: 2026 },
      }}
    />
  )
}

export function AdminBoundariesPage() {
  return (
    <AdminCrudPage
      config={{
        title: 'Границы',
        subtitle: 'Город / область',
        api: adminApi.boundaries,
        columns: [
          { key: 'code', label: 'Код' },
          { key: 'name', label: 'Название' },
          { key: 'boundary_type', label: 'Тип' },
          { key: 'color', label: 'Цвет' },
          { key: 'is_visible', label: 'Видима', render: bool },
          { key: 'order', label: 'Порядок' },
        ],
        fields: [
          { key: 'code', label: 'Код *' },
          { key: 'name', label: 'Название *' },
          { key: 'boundary_type', label: 'Тип', type: 'select', options: [
            { value: 'city', label: 'Город' },
            { value: 'region', label: 'Область' },
          ]},
          { key: 'color', label: 'Цвет' },
          { key: 'weight', label: 'Толщина', type: 'number' },
          { key: 'dash_array', label: 'Пунктир' },
          { key: 'fill_opacity', label: 'Прозрачность заливки', type: 'number', step: 0.1 },
          { key: 'geometry', label: 'Геометрия (GeoJSON)', type: 'json', rows: 6 },
          { key: 'order', label: 'Порядок', type: 'number' },
          { key: 'is_visible', label: 'Видима', type: 'checkbox' },
        ],
        defaultForm: { boundary_type: 'city', color: '#e74c3c', weight: 2, fill_opacity: 0.1, is_visible: true, order: 0 },
      }}
    />
  )
}

export function AdminMahallasPage() {
  return (
    <AdminCrudPage
      config={{
        title: 'Махалли',
        api: adminApi.mahallas,
        columns: [
          { key: 'code', label: 'Код' },
          { key: 'name', label: 'Название' },
          { key: 'is_active', label: 'Активна', render: bool },
        ],
        fields: [
          { key: 'code', label: 'Код *' },
          { key: 'name', label: 'Название *' },
          { key: 'geometry', label: 'Геометрия (GeoJSON)', type: 'json' },
          { key: 'is_active', label: 'Активна', type: 'checkbox' },
        ],
        defaultForm: { is_active: true },
      }}
    />
  )
}

export function AdminYearsPage() {
  return (
    <AdminCrudPage
      config={{
        title: 'Годы мониторинга',
        api: adminApi.years,
        columns: [
          { key: 'year', label: 'Год' },
          { key: 'year_type', label: 'Тип' },
          { key: 'is_current', label: 'Текущий', render: bool },
          { key: 'is_active', label: 'Активен', render: bool },
          { key: 'note', label: 'Заметка' },
        ],
        fields: [
          { key: 'year', label: 'Год *', type: 'number' },
          { key: 'year_type', label: 'Тип', type: 'select', options: [
            { value: 'monitoring', label: 'Мониторинг' },
            { value: 'urbanization', label: 'Урбанизация' },
          ]},
          { key: 'note', label: 'Заметка', type: 'textarea' },
          { key: 'is_current', label: 'Текущий', type: 'checkbox' },
          { key: 'is_active', label: 'Активен', type: 'checkbox' },
        ],
        defaultForm: { year_type: 'monitoring', is_active: true, year: 2026 },
      }}
    />
  )
}

export function AdminVersionsPage() {
  return (
    <AdminCrudPage
      config={{
        title: 'Версии объектов',
        subtitle: 'Снимки по годам',
        api: adminApi.versions,
        columns: [
          { key: 'id', label: 'ID' },
          { key: 'land', label: 'Объект' },
          { key: 'year', label: 'Год' },
          { key: 'area_sqm', label: 'м²' },
          { key: 'length_m', label: 'м' },
          { key: 'status', label: 'Статус' },
        ],
        fields: [
          { key: 'land', label: 'ID объекта *', type: 'number' },
          { key: 'year', label: 'Год *', type: 'number' },
          { key: 'area_sqm', label: 'Площадь м²', type: 'number' },
          { key: 'length_m', label: 'Длина м', type: 'number' },
          { key: 'status', label: 'Статус', type: 'select', options: STATUS_OPTS },
          { key: 'condition', label: 'Состояние' },
          { key: 'change_note', label: 'Примечание', type: 'textarea' },
          { key: 'geometry', label: 'Геометрия', type: 'json', rows: 5 },
        ],
        defaultForm: { year: 2026, status: 'active' },
      }}
    />
  )
}

export function AdminRecordsPage() {
  return (
    <AdminCrudPage
      config={{
        title: 'Записи мониторинга',
        api: adminApi.records,
        columns: [
          { key: 'id', label: 'ID' },
          { key: 'land', label: 'Объект' },
          { key: 'year', label: 'Год' },
          { key: 'delta_area_ha', label: 'Δ га' },
          { key: 'delta_length_km', label: 'Δ км' },
          { key: 'status', label: 'Статус' },
        ],
        fields: [
          { key: 'land', label: 'ID объекта *', type: 'number' },
          { key: 'year', label: 'Год *', type: 'number' },
          { key: 'description', label: 'Описание', type: 'textarea' },
          { key: 'delta_area_ha', label: 'Δ площадь (га)', type: 'number', step: 0.0001 },
          { key: 'delta_length_km', label: 'Δ длина (км)', type: 'number', step: 0.001 },
          { key: 'status', label: 'Статус', type: 'select', options: [
            { value: 'draft', label: 'Черновик' },
            { value: 'approved', label: 'Утверждено' },
            { value: 'rejected', label: 'Отклонено' },
          ]},
        ],
        defaultForm: { status: 'draft', year: 2026 },
      }}
    />
  )
}

export function AdminUrbanizationPage() {
  return (
    <AdminCrudPage
      config={{
        title: 'Слои урбанизации',
        api: adminApi.urbanization,
        columns: [
          { key: 'year', label: 'Год' },
          { key: 'name', label: 'Название' },
          { key: 'layer_kind', label: 'Тип' },
          { key: 'area_ha', label: 'га' },
          { key: 'growth_pct', label: '%' },
          { key: 'is_visible', label: 'Видим', render: bool },
        ],
        fields: [
          { key: 'year', label: 'Год *', type: 'number' },
          { key: 'name', label: 'Название *' },
          { key: 'layer_kind', label: 'Тип', type: 'select', options: [
            { value: 'urban', label: 'Городская' },
            { value: 'agriculture', label: 'Сельхоз' },
            { value: 'other', label: 'Другое' },
          ]},
          { key: 'area_ha', label: 'Площадь (га)', type: 'number' },
          { key: 'growth_pct', label: 'Рост %', type: 'number' },
          { key: 'color', label: 'Цвет' },
          { key: 'note', label: 'Заметка', type: 'textarea' },
          { key: 'geometry', label: 'Геометрия', type: 'json', rows: 5 },
          { key: 'is_visible', label: 'Видим', type: 'checkbox' },
        ],
        defaultForm: { layer_kind: 'urban', is_visible: true, color: '#f39c12', year: 2025 },
      }}
    />
  )
}

export function AdminIssuesPage() {
  return (
    <AdminCrudPage
      config={{
        title: 'Проблемные участки',
        api: adminApi.issues,
        columns: [
          { key: 'id', label: 'ID' },
          { key: 'title', label: 'Заголовок' },
          { key: 'severity', label: 'Важность' },
          { key: 'status', label: 'Статус' },
          { key: 'geometry_kind', label: 'Геометрия' },
          { key: 'created_at', label: 'Создано', render: (v) => v ? new Date(v).toLocaleDateString('ru') : '—' },
        ],
        fields: [
          { key: 'title', label: 'Заголовок *' },
          { key: 'description', label: 'Описание *', type: 'textarea' },
          { key: 'severity', label: 'Важность', type: 'select', options: SEV_OPTS },
          { key: 'status', label: 'Статус', type: 'select', options: ISSUE_STATUS },
          { key: 'geometry_kind', label: 'Тип', type: 'select', options: [
            { value: 'Point', label: 'Точка' },
            { value: 'LineString', label: 'Линия' },
            { value: 'Polygon', label: 'Полигон' },
          ]},
          { key: 'latitude', label: 'Широта', type: 'number', step: 0.0001 },
          { key: 'longitude', label: 'Долгота', type: 'number', step: 0.0001 },
          { key: 'land', label: 'ID объекта', type: 'number' },
          { key: 'geometry', label: 'Геометрия', type: 'json' },
        ],
        defaultForm: { severity: 'medium', status: 'new', geometry_kind: 'Point' },
      }}
    />
  )
}

export function AdminChangesPage() {
  return (
    <AdminCrudPage
      config={{
        title: 'Журнал изменений',
        subtitle: 'Только просмотр',
        api: adminApi.changes,
        readOnly: true,
        columns: [
          { key: 'id', label: 'ID' },
          { key: 'land', label: 'Объект' },
          { key: 'change_type', label: 'Тип' },
          { key: 'field_name', label: 'Поле' },
          { key: 'description', label: 'Описание' },
          { key: 'changed_at', label: 'Дата', render: (v) => v ? new Date(v).toLocaleString('ru') : '—' },
        ],
        fields: [],
      }}
    />
  )
}

export function AdminNoticesPage() {
  return (
    <AdminCrudPage
      config={{
        title: 'Объявления системы',
        subtitle: 'Сообщения на главной панели',
        api: adminApi.notices,
        columns: [
          { key: 'id', label: 'ID' },
          { key: 'title', label: 'Заголовок' },
          { key: 'is_active', label: 'Активно', render: bool },
          { key: 'updated_at', label: 'Обновлено', render: (v) => v ? new Date(v).toLocaleString('ru') : '—' },
        ],
        fields: [
          { key: 'title', label: 'Заголовок *' },
          { key: 'message', label: 'Текст *', type: 'textarea', rows: 5 },
          { key: 'is_active', label: 'Активно', type: 'checkbox' },
        ],
        defaultForm: { is_active: true },
      }}
    />
  )
}

export default function AdminGuide({ title = 'Инструкция', steps = [], note }) {
  if (!steps.length && !note) return null
  return (
    <aside className="admin-guide">
      <div className="admin-guide__head">
        <span className="admin-guide__badge">i</span>
        <div>
          <p className="admin-guide__kicker">Как пользоваться</p>
          <h3>{title}</h3>
        </div>
      </div>
      {steps.length > 0 && (
        <ol className="admin-guide__steps">
          {steps.map((s, i) => (
            <li key={s}>
              <b>{String(i + 1).padStart(2, '0')}</b>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      )}
      {note && <p className="admin-guide__note">{note}</p>}
    </aside>
  )
}

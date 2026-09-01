/** ISO Cluster klassifikatsiya — hisobot uslubidagi xarita. */

export default function UrbanClassificationFrame({
  mapSet,
  labels,
  emptyLabel,
}) {
  const url = mapSet?.classified_preview_url

  if (!mapSet) {
    return (
      <div className="urban-thematic urban-thematic--empty">
        {emptyLabel && <p className="muted">{emptyLabel}</p>}
      </div>
    )
  }

  if (!url) {
    return (
      <div className="urban-thematic urban-thematic--empty">
        <p className="muted">{emptyLabel || 'Preview yo‘q'}</p>
      </div>
    )
  }

  return (
    <div className="urban-thematic">
      <div className="urban-thematic__canvas">
        <img
          src={url}
          alt="Urban extraction (ISO Cluster)"
          className="urban-thematic__img"
        />
        <div className="urban-thematic__legend">
          <div className="urban-thematic__legend-item urban-thematic__legend-item--non">
            <span className="urban-thematic__swatch" />
            <span>{labels.nonUrban}</span>
          </div>
          <div className="urban-thematic__legend-item urban-thematic__legend-item--urban">
            <span className="urban-thematic__swatch" />
            <span>{labels.urban}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

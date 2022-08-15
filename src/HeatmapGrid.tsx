import {JSXInternal} from 'preact/src/jsx'
import {useDispatch} from './hooks'
import {useEffect, useMemo, useRef, useState} from 'preact/hooks'
import {AXIS_HEIGHT, AXIS_WIDTH, COLUMN_WIDTH, ROW_HEIGHT} from './constants'
import {h} from 'preact'
import {HeatmapView} from './Heatmap'
import {Data, Sample} from './types'

export type HeatmapGridProps = {
  data: Data
  width: number
  height: number
  view: HeatmapView
  showTiles?: boolean
  showBubbles?: boolean
  showBadges?: boolean
  onViewChange: (view: HeatmapView) => void
}

type Buckets = Map<number, Map<number, Sample[]>>

function align(value: number, step: number) {
  return value - value % step
}

export function HeatmapGrid(props: HeatmapGridProps): JSXInternal.Element {
  const dispatch = useDispatch()
  const {data, width, height, view, showTiles, showBubbles, showBadges, onViewChange} = props
  const {
    originX,
    originY,
    centerX,
    centerY,
    scaleX,
    scaleY
  } = view

  const [svg, setSvg] = useState<SVGSVGElement>(null)
  const setTransform = (transform: string) => (svg.firstElementChild as SVGGElement).setAttribute('transform', transform)

  const [selection, setSelection] = useState<Partial<DOMRect> | null>(null)

  const animationFrame = useRef(0)
  const [mouseDownPoint, setMouseDownPoint] = useState<{ x: number, y: number }>(null)

  const minX = originX + (1 - scaleX) * centerX
  const maxX = minX + width * scaleX
  const minY = originY + (1 - scaleY) * centerY
  const maxY = minX + height * scaleY

  const updateCursor = (x: number, y: number) => {
    x = Math.min(maxX, Math.max(minX, x))
    y = Math.min(maxY, Math.max(minY, y))
    return dispatch({
      type: 'SET_POINTER',
      payload: {
        x: x,
        y: y,
        X: (x - minX) / (maxX - minX),
        Y: (y - minY) / (maxY - minY)
      }
    })
  }

  const columnWidth = COLUMN_WIDTH / Math.floor(scaleX)
  const rowHeight = ROW_HEIGHT / Math.floor(scaleY)

  useEffect(() => {
    const listener = function (event: KeyboardEvent) {
      switch (event.key) {
        case 'Escape':
          onViewChange({
            originX: 0,
            originY: 0,
            centerX: 0,
            centerY: 0,
            scaleX: 1,
            scaleY: 1
          })
          return
      }
    }
    window.addEventListener('keydown', listener)
    return () => {
      window.removeEventListener('keydown', listener)
    }
  }, [])

  return (
    <svg className="heatmap-grid" ref={setSvg} style={{left: AXIS_WIDTH, top: AXIS_HEIGHT}}
         width={width}
         height={height}
         onContextMenu={e=>{
           e.preventDefault()
           e.stopPropagation()
         }}
         onDblClick={event => {
           onViewChange({
             originX: 0,
             originY: 0,
             centerX: 0,
             centerY: 0,
             scaleX: 1,
             scaleY: 1
           })
         }}
         onMouseDown={event => {
           if (event.button === 2) {
             setMouseDownPoint({
               x: event.offsetX,
               y: event.offsetY
             })
             event.preventDefault()
             event.stopPropagation()
           } else {
             const x = (event.offsetX-originX-centerX) / scaleX + centerX
             const y = (event.offsetY-originY-centerY) / scaleY + centerY
             setSelection({
               x: align(x, columnWidth),
               y: align(y, rowHeight),
               width: columnWidth,
               height: rowHeight
             })
           }
         }}
         onMouseMove={event => {
           cancelAnimationFrame(animationFrame.current)
           animationFrame.current = requestAnimationFrame(() => {
             let x = event.offsetX
             let y = event.offsetY
             if (mouseDownPoint) {
               const dx = x - mouseDownPoint.x
               const dy = y - mouseDownPoint.y
               x -= dx
               y -= dy
               setTransform(`translate(${originX + dx},${originY + dy})`)
             }
             if (selection) {
               const x = (event.offsetX-originX-centerX) / scaleX + centerX
               const y = (event.offsetY-originY-centerY) / scaleY + centerY
               const dx = x - selection.x
               const dy = y - selection.y
               setSelection({
                 ...selection,
                 width: align(dx, columnWidth) + columnWidth,
                 height: align(dy, rowHeight) + rowHeight
               })
             }
             updateCursor(x, y)
           })
         }}
         onMouseUp={event => {
           if (mouseDownPoint) {
             const x = event.offsetX
             const y = event.offsetY
             onViewChange({
               ...view,
               originX: originX + (x - mouseDownPoint.x),
               originY: originY + (y - mouseDownPoint.y)
             })
             updateCursor(x, y)
             setMouseDownPoint(null)
           } else {
             const minX = selection.x
             const maxX = minX + selection.width
             const minY = selection.y
             const maxY = minY + selection.height
             for (const sample of data) {
               let x = sample.x * width
               let y = sample.y * height
               if (x >= minX && x < maxX && y >= minY && y < maxY) {
                 console.log(sample)
               }
             }
             setSelection(null)
           }
         }}
         onMouseLeave={event=>{

         }}
         onWheel={event => {
           const x = (event.offsetX-originX-centerX) / scaleX + centerX
           const y = (event.offsetY-originY-centerY) / scaleY + centerY
           onViewChange({
             originX: originX - (x - centerX) * (1 - scaleX),
             originY: originY - (y - centerY) * (1 - scaleY),
             centerX: x,
             centerY: y,
             scaleX: event.deltaY < 0 ? scaleX * 1.125 : Math.max(1, scaleX / 1.125),
             scaleY: event.deltaY < 0 ? scaleY * 1.125 : Math.max(1, scaleY / 1.125)
           })
           updateCursor(x, y)
         }}>
      {useMemo(() => {

        let minX = centerX - (1 / scaleX) * (originX + centerX)
        let maxX = Math.min(width, minX + width / scaleX)
        minX = align(Math.max(0, minX), columnWidth)

        let minY = centerY - (1 / scaleY) * (originY + centerY)
        let maxY = Math.min(height, minY + height / scaleY)
        minY = align(Math.max(0, minY), rowHeight)

        const buckets: Buckets = new Map()

        for (const sample of data) {
          let x = sample.x * width
          let y = sample.y * height
          if (x >= minX && x < maxX && y >= minY && y < maxY) {
            x = align(x, columnWidth)
            y = align(y, rowHeight)
            let slice = buckets.get(x)
            if (slice === undefined) {
              slice = new Map()
              slice.set(y, [sample])
              buckets.set(x, slice)
            } else {
              const bucket = slice.get(y)
              if (bucket === undefined) {
                slice.set(y, [sample])
              } else {
                slice.get(y).push(sample)
              }
            }
          }
        }

        const tiles: JSXInternal.Element[] = []
        for (let [x, slice] of buckets) {
          for (let [y, bucket] of slice) {
            const value = bucket ? bucket.reduce((total, {z}) => total + z, 0) / bucket.length : 0
            const hasBadge = value && bucket.length > 1
            tiles.push(
              <g key={x + ':' + y}>
                {showTiles && (
                  <rect fill={`hsl(200,80%,${Math.round(100 - 100 * value)}%)`}
                        x={x}
                        y={y}
                        width={columnWidth}
                        height={rowHeight}
                  />
                )}
                {showBubbles && bucket.map(({name, x, y, z}) => (
                  <ellipse cx={x * width} rx={5 / scaleX}
                           cy={y * height} ry={5 / scaleY}
                           fill={`hsl(100,80%,${Math.round(100 - 100 * z)}%)`}
                           onMouseOver={event => {
                             console.log("sample:", name, x.toFixed(3), y.toFixed(3))
                           }}
                  />
                ))}
                {(showBadges && hasBadge) && (
                  <g transform={`translate(${x},${y}) scale(${1 / scaleX},${1 / scaleY})`}>
                    <circle className="badge-background" cx={12} cy={12}
                            r={bucket.length > 99 ? 12 : 8}/>
                    <text className="badge-number" x={12} y={15}
                          text-anchor="middle">{bucket.length}</text>
                  </g>
                )}
              </g>
            )
          }
        }

        const lines: JSXInternal.Element[] = []
        for (let x = minX; x <= maxX; x += columnWidth) {
          lines.push(<line key={`meridian-${x}`} x1={x} y1={minY} x2={x} y2={maxY}/>)
        }
        for (let y = minY; y <= maxY; y += rowHeight) {
          lines.push(<line key={`parallel-${y}`} x1={minX} y1={y} x2={maxX} y2={y}/>)
        }

        return (
          <g className="grid" transform={`translate(${originX},${originY})`}>
            <g className="animated" transform={`matrix(${scaleX} 0 0 ${scaleY} ${centerX * (1 - scaleX)} ${centerY * (1 - scaleY)})`}>
            <g className="tiles-layer">{tiles}</g>
            <g className="lines-layer">{lines}</g>
            {selection ? (
              <g className="selection-layer">
                <rect className="selection" {...selection}/>
              </g>
            ) : null}
            </g>
          </g>
        )
      }, [data, view, width, height, showBubbles, showBadges, showTiles, selection])}
    </svg>
  )
}
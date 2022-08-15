import {h} from 'preact'
import {useDispatch} from './hooks'
import {useRef, useState} from 'preact/hooks'
import {AXIS_HEIGHT, AXIS_WIDTH, COLUMN_WIDTH} from './constants'
import {XCursor} from './XCursor'
import {HeatmapView} from './Heatmap'

function renderTicks(origin: number, scale: number, center: number, width: number, renderTick): SVGGElement[] {
  const columnWidth = COLUMN_WIDTH / Math.floor(scale)
  let minX = center - (1 / scale) * (origin + center)
  minX -= minX % columnWidth
  let maxX = Math.min(width, minX + width / scale)
  minX = Math.max(0, minX) || columnWidth

  const ticks = []
  for (let x = minX; x < maxX; x += columnWidth) {
    ticks.push(renderTick(x))
  }
  return ticks
}

export function XAxis(props: { width: number, view: HeatmapView, tick: (x: number) => string, onChange: (origin: number | undefined, center?: number | undefined, scale?: number | undefined) => void }) {
  const dispatch = useDispatch()
  const {width, view, tick, onChange} = props
  const {
    originX: origin,
    centerX: center,
    scaleX: scale
  } = view
  const shrink = 1 / scale

  const [svg, setSvg] = useState<SVGSVGElement>(null)
  const setTransform = (transform: string) => (svg.firstElementChild as SVGGElement).setAttribute('transform', transform)

  const animationFrame = useRef(0)
  const [mouseDownX, setMouseDownX] = useState<number>(null)

  const y2 = AXIS_HEIGHT - 10
  const y1 = 2 * y2 / 3
  const dy = y1 - 2

  const minX = origin + (1 - scale) * center
  const maxX = minX + width * scale

  const updateXCursor = (x: number) => {
    x = Math.min(maxX, Math.max(minX, x))
    return dispatch({
      type: 'SET_POINTER',
      payload: {
        x: x,
        y: 0,
        X: (x - minX) / (maxX - minX),
        Y: 0
      }
    })
  }

  return (
    <svg ref={setSvg} style={{left: AXIS_WIDTH}} width={width} height={AXIS_HEIGHT}
         onDblClick={event => {
           onChange(0,0,1)
         }}
         onMouseDown={event => {
           setMouseDownX(event.offsetX)
         }}
         onMouseMove={event => {
           cancelAnimationFrame(animationFrame.current)
           animationFrame.current = requestAnimationFrame(() => {
             let x = event.offsetX
             if (mouseDownX) {
               let dx = x - mouseDownX
               x -= dx
               setTransform(`matrix(${scale} 0 0 1 ${minX + dx} 0)`)
             }
             updateXCursor(x)
           })
         }}
         onMouseUp={event => {
           if (mouseDownX) {
             const x = event.offsetX
             onChange(origin + (x - mouseDownX))
             updateXCursor(x)
             setMouseDownX(null)
           }
         }}
         onWheel={event => {
           const x = event.offsetX - origin
           onChange(origin, x, event.deltaY < 0 ? scale * 1.125 : Math.max(1, scale / 1.125))
           updateXCursor(x)
         }}>
      <g className="axis" transform={`matrix(${scale} 0 0 1 ${origin + center * (1 - scale)} 0)`}>
        <line key="left" x1={shrink} y1={y2 / 2} x2={shrink} y2={y2}/>
        <line key="bottom" x1={0} y1={y2} x2={width} y2={y2}/>
        <line key="right" x1={width - shrink} y1={y2 / 2} x2={width - shrink} y2={y2}/>
        {renderTicks(origin, scale, center, width, (x: number) => (
          <g key={x} transform={`translate(${x},0)`}>
            <text className="x-tick" dy={dy}>{tick(x / width)}</text>
            <line y1={y1} y2={y2}/>
          </g>
        ))}
        <g transform={`matrix(${shrink} 0 0 1 ${center - shrink * (origin + center)} 0)`}>
          <XCursor key="cursor" tick={tick}/>
        </g>
      </g>
      <style>{`
        line { vector-effect: non-scaling-stroke; }
        .x-tick { transform: scale(${shrink}, 1); }
      `}</style>
    </svg>
  )
}

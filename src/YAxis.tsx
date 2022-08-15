import {h} from 'preact'
import {useDispatch} from './hooks'
import {useRef, useState} from 'preact/hooks'
import {AXIS_HEIGHT, AXIS_WIDTH, COLUMN_WIDTH, ROW_HEIGHT} from './constants'
import {YCursor} from './YCursor'
import {HeatmapView} from './Heatmap'

function renderTicks(origin: number, scale: number, center: number, height: number, renderTick): SVGGElement[] {
  const rowHeight = ROW_HEIGHT / Math.floor(scale)
  let minY = center - (1 / scale) * (origin + center)
  minY -= minY % rowHeight
  let maxY = Math.min(height, minY + height / scale)
  minY = Math.max(0, minY) || rowHeight

  const ticks = []
  for (let y = minY; y < maxY; y += rowHeight) {
    ticks.push(renderTick(y))
  }
  return ticks
}

export function YAxis(props: { height: number, view: HeatmapView, tick: (y: number) => string, onChange: (origin: number | undefined, center?: number | undefined, scale?: number | undefined) => void }) {
  const dispatch = useDispatch()
  const {height, view, tick, onChange} = props
  const {
    originY: origin,
    centerY: center,
    scaleY: scale
  } = view
  const shrink = 1 / scale

  const [svg, setSvg] = useState<SVGSVGElement>(null)
  const setTransform = (transform: string) => (svg.firstElementChild as SVGGElement).setAttribute('transform', transform)

  const animationFrame = useRef(0)
  const [mouseDownY, setMouseDownY] = useState<number>(null)

  const x2 = AXIS_WIDTH - 10
  const x1 = 3 * x2 / 4
  const dx = x1 - 16

  const minY = origin + (1 - scale) * center
  const maxY = minY + height * scale

  const updateYCursor = (y: number) => {
    y = Math.min(maxY, Math.max(minY, y))
    return dispatch({
      type: 'SET_POINTER',
      payload: {
        x: 0,
        y: y,
        X: 0,
        Y: (y - minY) / (maxY - minY)
      }
    })
  }

  return (
    <svg ref={setSvg} style={{top: AXIS_HEIGHT}} height={height} width={AXIS_WIDTH}
         onDblClick={event => {
           onChange(0,0,1)
         }}
         onMouseDown={event => {
           setMouseDownY(event.offsetY)
         }}
         onMouseMove={event => {
           cancelAnimationFrame(animationFrame.current)
           animationFrame.current = requestAnimationFrame(() => {
             let y = event.offsetY
             if (mouseDownY) {
               let dy = y - mouseDownY
               y -= dy
               setTransform(`matrix(1 0 0 ${scale} 0 ${minY + dy})`)
             }
             updateYCursor(y)
           })
         }}
         onMouseUp={event => {
           if (mouseDownY) {
             const y = event.offsetY
             onChange(origin + (y - mouseDownY))
             updateYCursor(y)
             setMouseDownY(null)
           }
         }}
         onWheel={event => {
           const y = event.offsetY - origin
           onChange(origin, y, event.deltaY < 0 ? scale * 1.125 : Math.max(1, scale / 1.125))
           updateYCursor(y)
         }}>
      <g className="axis" transform={`matrix(1 0 0 ${scale} 0 ${origin + center * (1 - scale)})`}>
        <line key="top" x1={x2 / 2} y1={shrink} x2={x2} y2={shrink}/>
        <line key="right" x1={x2} y1={0} x2={x2} y2={height}/>
        <line key="bottom" x1={x2 / 2} y1={height - shrink} x2={x2} y2={height - shrink}/>
        {renderTicks(origin, scale, center, height, (y: number) => (
          <g key={y} transform={`translate(0, ${y})`}>
            <text className="y-tick" dx={dx} dy=".33em">{tick(y / height)}</text>
            <line x1={x1} x2={x2}/>
          </g>
        ))}
        <g transform={`matrix(1 0 0 ${shrink} 0 ${center - shrink * (origin + center)})`}>
          <YCursor key="cursor" tick={tick}/>
        </g>
      </g>
      <style>{`
        line { vector-effect: non-scaling-stroke; }
        .y-tick { transform: scale(1,${shrink}); }
      `}</style>
    </svg>
  )
}

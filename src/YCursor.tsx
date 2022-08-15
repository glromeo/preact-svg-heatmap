import {useSelector} from './hooks'
import {AppState} from './types'
import {AXIS_WIDTH} from './constants'
import {h} from 'preact'

export function YCursor({tick}: { tick: (y: number) => string }) {
  const {y,Y} = useSelector<AppState, AppState['pointer']>(state => state.pointer)
  const x2 = AXIS_WIDTH - 10
  const x1 = 3 * x2 / 4
  return (
    <g className="axis pointer" transform={`translate(0,${y})`}>
      <text dx={x1 - 16} dy=".33em">{tick(Y)}</text>
      <line x1={x1} x2={x2}/>
    </g>
  )
}
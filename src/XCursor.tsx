import {useSelector} from './hooks'
import {AppState} from './types'
import {AXIS_HEIGHT} from './constants'
import {h} from 'preact'

export function XCursor({tick}: { tick: (x: number) => string }) {
    const {x,X} = useSelector<AppState, AppState['pointer']>(state => state.pointer)
    const y2 = AXIS_HEIGHT - 10
    const y1 = 2 * y2 / 3
    return (
        <g className="axis pointer" transform={`translate(${x},0)`}>
            <text dy={y1 - 2}>{tick(X)}</text>
            <line y1={y1} y2={y2}/>
        </g>
    )
}
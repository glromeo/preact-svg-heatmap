import {h} from 'preact'
import {useMemo, useState} from 'preact/hooks'
import {Data, Sample} from './types'
import {useDispatch} from './hooks'

import './Heatmap.css'
import {XAxis} from './XAxis'
import {useHeatmapLayout} from './hooks/heatmapLayout'
import {YAxis} from './YAxis'
import {HeatmapGrid} from './HeatmapGrid'

export type HeatmapProps = {
    data: Data
    showTiles?: boolean
    showBadges?: boolean
    showBubbles?: boolean
    tickX: (x: number) => string
    tickY: (y: number) => string
}

export type HeatmapView = {
    originX: number
    originY: number
    centerX: number
    centerY: number
    scaleX: number
    scaleY: number
}

export const INITIAL_VIEW: HeatmapView = {
    originX: 0,
    originY: 0,
    centerX: 0,
    centerY: 0,
    scaleX: 1,
    scaleY: 1,
}

export function Heatmap({data, showTiles, showBadges, showBubbles, tickX, tickY}: HeatmapProps) {
    const dispatch = useDispatch()

    const [container, setContainer] = useState<HTMLDivElement>(null)
    const {
        width,
        height,
        columns,
        rows
    } = useHeatmapLayout(container)

    const [view, setView] = useState<HeatmapView>(INITIAL_VIEW)

    useMemo(() => {
        dispatch({type: 'SET_VIEW', payload: view})
    }, [view])

    return (
        <div className="heatmap" ref={setContainer}>
            <XAxis width={width} view={view} tick={tickX}
                   onChange={(origin, center, scale) => {
                       setView({
                           ...view,
                           originX: origin ?? view.originX,
                           centerX: center ?? view.centerX,
                           scaleX: scale ?? view.scaleX
                       })
                   }}/>
            <YAxis height={height} view={view} tick={tickY}
                   onChange={(origin, center, scale) => {
                       setView({
                           ...view,
                           originY: origin ?? view.originY,
                           centerY: center ?? view.centerY,
                           scaleY: scale ?? view.scaleY
                       })
                   }}/>
            <HeatmapGrid data={data}
                         width={width}
                         height={height}
                         view={view}
                         showTiles={showTiles}
                         showBadges={showBadges}
                         showBubbles={showBubbles}
                         onViewChange={setView} />
        </div>
    )
}



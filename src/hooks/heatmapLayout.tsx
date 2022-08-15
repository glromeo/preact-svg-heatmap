import {useLayoutEffect, useState} from 'preact/hooks'
import {AXIS_HEIGHT, AXIS_WIDTH, COLUMN_WIDTH, ROW_HEIGHT} from '../constants'

const INITIAL_HEATMAP = {
    width: 0,
    height: 0,
    columns: 0,
    rows: 0
}

export function useHeatmapLayout(container: HTMLDivElement) {
    const [heatmap, setHeatmap] = useState<{
        width: number
        height: number
        columns: number
        rows: number
    }>(INITIAL_HEATMAP)
    useLayoutEffect(() => {
        const createModel = (container: HTMLDivElement) => {
            let {width, height} = container.getBoundingClientRect()
            let columns = Math.floor((width - AXIS_WIDTH) / COLUMN_WIDTH)
            let rows = Math.floor((height - AXIS_HEIGHT) / ROW_HEIGHT)
            return {
                width: columns * COLUMN_WIDTH,
                height: rows * ROW_HEIGHT,
                columns,
                rows
            }
        }
        if (container) {
            const observer = new ResizeObserver(() => {
                const heatmap = createModel(container)
                setHeatmap(heatmap)
            })
            observer.observe(container)
            const heatmap = createModel(container)
            setHeatmap(heatmap)
            return () => {
                observer.disconnect()
            }
        }
    }, [container])
    return heatmap
}
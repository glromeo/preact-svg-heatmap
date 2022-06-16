import {RefObject} from 'preact'
import {useLayoutEffect, useState} from 'preact/hooks'

export type RectBox = { x: number, y: number, width: number, height: number }

export type HeatmapGrid = {
    left: number
    top: number
    right: number
    bottom: number
    width: number
    height: number
    columns: number
    rows: number
    columnWidth: number
    rowHeight: number
}

const PADDING_LEFT = 50
const PADDING_TOP = 30

const COLUMN_WIDTH = 100
const ROW_HEIGHT = 25

const INITIAL_DIMENSIONS = {
    left: PADDING_LEFT,
    top: PADDING_TOP,
    right: PADDING_LEFT,
    bottom: PADDING_TOP,
    width: 0,
    height: 0,
    columns: 0,
    rows: 0,
    columnWidth: COLUMN_WIDTH,
    rowHeight: ROW_HEIGHT
}

function createModel(container: HTMLDivElement) {
    let {width, height} = container.getBoundingClientRect()
    width -= PADDING_LEFT
    height -= PADDING_TOP
    return {
        left: PADDING_LEFT,
        top: PADDING_TOP,
        right: Math.floor(width / COLUMN_WIDTH) * COLUMN_WIDTH,
        bottom: Math.floor(height / ROW_HEIGHT) * ROW_HEIGHT,
        width,
        height,
        columns: Math.floor(width / COLUMN_WIDTH),
        rows: Math.floor(height / ROW_HEIGHT),
        columnWidth: COLUMN_WIDTH,
        rowHeight: ROW_HEIGHT
    }
}

export function useHeatmapGrid({current: container}: RefObject<HTMLDivElement>) {

    const [model, setModel] = useState<HeatmapGrid>(INITIAL_DIMENSIONS)

    useLayoutEffect(() => {
        if (container) {
            const observer = new ResizeObserver(() => {
                setModel(createModel(container))
            })
            setModel(createModel(container))
            observer.observe(container)
            return () => {
                observer.disconnect()
            }
        }
    }, [container])

    return model
}

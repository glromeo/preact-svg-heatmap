import {h} from 'preact'
import {useCallback, useMemo, useRef, useState} from 'preact/hooks'
import {JSXInternal} from 'preact/src/jsx'

import './Heatmap.css'

import {useGlobalState} from './App'
import {HeatmapGrid, RectBox, useHeatmapGrid} from './hooks/heatmapGrid'
import {Data, Sample} from './types'

const EMPTY_SELECTION: RectBox = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
}

type HeatmapCell = {
    content: string
    value: number
    column: number
    row: number
    style: JSXInternal.CSSProperties
}

type AxisCell = {
    content: string
    style: JSXInternal.CSSProperties
}

function getContent(buckets: Record<number, Record<number, Sample[]>>, x: number, y: number) {
    let xBkt = buckets[x]
    if (!xBkt) {
        return ''
    }
    let yBkt = xBkt[y]
    if (!yBkt) {
        return ''
    }
    if (yBkt.length > 1) {
        return `multi (${yBkt.length})`
    } else {
        return yBkt[0].name || ''
    }
}

function getValue(buckets: Record<number, Record<number, Sample[]>>, x: number, y: number): number {
    let xBkt = buckets[x]
    if (!xBkt) {
        return 0
    }
    let yBkt = xBkt[y]
    if (!yBkt) {
        return 0
    }
    return yBkt.reduce((total, {z}) => total + z, 0) / yBkt.length
}

type Range = {
    min: number,
    max: number,
    span: number
}

export type HeatmapProps = {
    preview?: boolean,
    data: Data
    ranges: {
        x: Range,
        y: Range
    }
}


type Buckets = Record<number, Record<number, Sample[]>>

function addBucketValue(buckets: Buckets, column: number, row: number, sample: Sample) {
    let hzb = buckets[column]
    if (hzb === undefined) {
        buckets[column] = {
            [row]: [sample]
        }
    } else {
        let vtb = hzb[row]
        if (vtb === undefined) {
            hzb[row] = [sample]
        } else {
            hzb[row].push(sample)
        }
    }
}

function useBuckets(data: Sample[], heatmapGrid: HeatmapGrid, viewport?: HeatmapSelection | null) {
    return useMemo(() => {
        if (viewport === null) {
            return null
        }
        const buckets: Buckets = {}
        const {width, height, columnWidth, rowHeight} = heatmapGrid
        if (!viewport) {
            for (const sample of data) {
                const x = sample.x * width
                const y = sample.y * height
                const column = Math.floor(x / columnWidth)
                const row = Math.floor(y / rowHeight)
                addBucketValue(buckets, column, row, sample)
            }
        } else {
            const {x: minX, y: minY, width: viewWidth, height: viewHeight} = viewport
            const scaledColumnWidth = columnWidth * viewWidth / width
            const scaledRowHeight = rowHeight * viewHeight / height
            const maxX = viewWidth - scaledColumnWidth
            const maxY = viewHeight - scaledRowHeight
            for (const sample of data) {
                const x = (sample.x * width) - minX
                if (x >= 0 && x < maxX) {
                    const y = (sample.y * height) - minY
                    if (y >= 0 && y < maxY) {
                        const column = Math.floor(x / scaledColumnWidth)
                        const row = Math.floor(y / scaledRowHeight)
                        addBucketValue(buckets, column, row, sample)
                    }
                }
            }
        }
        return buckets
    }, [data, heatmapGrid, viewport])
}

type HeatmapSelection = {
    x: number;
    y: number;
    width: number;
    height: number;
    clientX: number;
    clientY: number;
    clientWidth: number;
    clientHeight: number;
    editing: boolean;
}

export function Heatmap({data, ranges: {x: rangeX, y: rangeY}}: HeatmapProps) {

    const [state, setState] = useGlobalState()

    const containerRef = useRef<HTMLDivElement>(null)
    const heatmapGrid = useHeatmapGrid(containerRef)

    const [selection, setSelection] = useState<HeatmapSelection | null>(null)
    const [zoom, setZoom] = useState(1)

    const heatmapBuckets = useBuckets(data, heatmapGrid)
    const selectionBuckets = useBuckets(data, heatmapGrid, selection)

    const heatmapJsx = useMemo(() => {
        const {columns, rows, columnWidth, rowHeight, right, bottom} = heatmapGrid

        const heatmapJsx: JSXInternal.Element[] = []
        for (let row = 0; row < rows; row++) {
            const y = row * rowHeight
            for (let column = 0; column < columns; column++) {
                const x = column * columnWidth
                let value = getValue(heatmapBuckets, column, row)
                // content: getContent(buckets, gridColumn, gridRow),
                heatmapJsx.push(<rect
                    fill={`hsl(200,80%,${Math.round(100 - 100 * value)}%)`}
                    x={x}
                    y={y}
                    width={columnWidth}
                    height={rowHeight}
                />)
                heatmapJsx.push(<line x1={x} y1={0} x2={x} y2={bottom} stroke="lightgray" vector-effect="non-scaling-stroke"/>)
            }
            heatmapJsx.push(<line x1={0} y1={y} x2={right} y2={y} stroke="lightgray" vector-effect="non-scaling-stroke"/>)
        }
        heatmapJsx.push(<line x1={right} y1={0} x2={right} y2={bottom} stroke="lightgray" vector-effect="non-scaling-stroke"/>)
        heatmapJsx.push(<line x1={0} y1={bottom} x2={right} y2={bottom} stroke="lightgray" vector-effect="non-scaling-stroke"/>)

        return heatmapJsx
    }, [heatmapBuckets, heatmapGrid])

    const xAxis = useMemo(() => {
        const {columns, columnWidth, right} = heatmapGrid
        const xAxis: JSXInternal.Element[] = []
        xAxis.push(<line x1={0} y1={-20} x2={0} y2={0} stroke="lightgray" vector-effect="non-scaling-stroke"/>)
        for (let column = 1; column < columns; column++) {
            const x = column * columnWidth
            xAxis.push(<text x={x - 8} y={-12}>{
                (rangeX.min + rangeX.span * column / columns).toFixed(2)
            }</text>)
            xAxis.push(<line x1={x} y1={-7.5} x2={x} y2={0} stroke="lightgray" vector-effect="non-scaling-stroke"/>)
        }
        xAxis.push(<line x1={0} y1={0} x2={right} y2={0} stroke="lightgray" vector-effect="non-scaling-stroke"/>)
        xAxis.push(<line x1={right} y1={-20} x2={right} y2={0} stroke="lightgray" vector-effect="non-scaling-stroke"/>)
        return xAxis
    }, [heatmapBuckets, heatmapGrid])

    const yAxis = useMemo(() => {
        const {rows, rowHeight, bottom} = heatmapGrid
        const yAxis: JSXInternal.Element[] = []
        const x2 = 45
        yAxis.push(<line x1={25} y1={0} x2={x2} y2={0} stroke="lightgray" vector-effect="non-scaling-stroke"/>)
        for (let row = 1; row < rows; row++) {
            const y = row * rowHeight
            yAxis.push(<text x={10} y={y + 5}>{
                (rangeY.min + rangeY.span * row / rows).toFixed(2)
            }</text>)
            yAxis.push(<line x1={37.5} y1={y} x2={x2} y2={y} stroke="lightgray" vector-effect="non-scaling-stroke"/>)
        }
        yAxis.push(<line x1={25} y1={bottom} x2={x2} y2={bottom} stroke="lightgray" vector-effect="non-scaling-stroke"/>)
        yAxis.push(<line x1={x2} y1={0} x2={x2} y2={bottom} stroke="lightgray" vector-effect="non-scaling-stroke"/>)
        return yAxis
    }, [heatmapBuckets, heatmapGrid])

    const selectionJsx = useMemo(() => {
        if (selectionBuckets) {
            const {width, height, columnWidth, rowHeight, right, bottom} = heatmapGrid
            const selectionJsx: JSXInternal.Element[] = []
            const scaledColumnWidth = selection ? columnWidth * selection.width / width : 0
            const scaledRowHeight = selection ? rowHeight * selection.height / height : 0

            for (const column of Object.keys(selectionBuckets).map(Number)) {
                const x = selection.x + column * scaledColumnWidth
                for (const row of Object.keys(selectionBuckets[column]).map(Number)) {
                    const y = selection.y + row * scaledRowHeight
                    let value = getValue(selectionBuckets, column, row)
                    selectionJsx.push(<rect
                        fill={`hsl(40,80%,${Math.round(100 - 100 * value)}%)`}
                        x={x}
                        y={y}
                        width={scaledColumnWidth}
                        height={scaledRowHeight}
                    />)
                }
            }
            return selectionJsx
        }
    }, [selectionBuckets, heatmapGrid, selection])

    const [zoomOrigin, setZoomOrigin] = useState({x: 0, y: 0})

    const svgRef = useRef<SVGSVGElement>(null)
    const clientToSvg = useMemo(() => {
        if (svgRef.current) {
            const {left, top, width, height} = heatmapGrid
            return svgRef.current.getScreenCTM()
                .translate(
                    left + (1 - zoom) * width / 2 - zoom * zoomOrigin.x,
                    top + (1 - zoom) * height / 2 - zoom * zoomOrigin.y
                )
                .scale(zoom, zoom)
                .inverse()
        }
    }, [svgRef.current, heatmapGrid, zoom, zoomOrigin])

    const onMouseDown = useCallback(({clientX, clientY, shiftKey}) => {
        if (shiftKey) {
            const {x, y} = new DOMPointReadOnly(clientX, clientY).matrixTransform(clientToSvg)
            const {columnWidth, rowHeight} = heatmapGrid
            setSelection({
                x: x - (x % columnWidth),
                y: y - (y % rowHeight),
                width: columnWidth,
                height: rowHeight,
                clientX,
                clientY,
                clientWidth: 0,
                clientHeight: 0,
                editing: true
            })
        } else if (zoom > 1) {
            setZoomOrigin({x: clientX - heatmapGrid.width / 2, y: clientY - heatmapGrid.height / 2})
        }
    }, [selection, clientToSvg, heatmapGrid])

    const onMouseMove = useCallback(({clientX, clientY}) => {
        const {x, y} = new DOMPointReadOnly(clientX, clientY).matrixTransform(clientToSvg)
        if (selection?.editing) {
            const {columnWidth, rowHeight} = heatmapGrid
            const width = Math.max(columnWidth, columnWidth * Math.ceil(x / columnWidth) - selection.x)
            const height = Math.max(rowHeight, rowHeight * Math.ceil(y / rowHeight) - selection.y)
            if (width !== selection.width || height !== selection.height) {
                setSelection({
                    ...selection,
                    width,
                    height,
                    clientWidth: clientX - selection.clientX,
                    clientHeight: clientY - selection.clientY
                })
            }
        }
        setState({...state, pointer: {...state.pointer, x, y}})
    }, [state, selection, clientToSvg, heatmapGrid])

    const onMouseUp = useCallback(() => {
        if (selection?.editing) {
            setSelection({
                ...selection,
                editing: false
            })
            setZoom(Math.min(
                heatmapGrid.width / selection.clientWidth,
                heatmapGrid.height / selection.clientHeight
            ))
            setZoomOrigin({
                x: selection.clientX + (selection.clientWidth - heatmapGrid.width) / 2,
                y: selection.clientY + (selection.clientHeight - heatmapGrid.height) / 2
            })
        }
    }, [selection])

    const onWheel = useCallback(event => {
        if (!event.altKey) {
            if (event.deltaY > 0) {
                setZoom(Math.max(1, zoom / 2))
                if (zoom <= 1.2) {
                    setZoomOrigin({x: 0, y: 0})
                }
            } else {
                setZoom(Math.min(10, zoom * 2))
            }
            setState({...state, pointer: {...state.pointer, z: zoom}})
            event.stopPropagation()
            event.preventDefault()
        }
    }, [state, zoom])

    const transform = useMemo(() => {
        const {left, top, width, height} = heatmapGrid
        const tx = left + (1 - zoom) * width / 2 - zoom * zoomOrigin.x
        const ty = top + (1 - zoom) * height / 2 - zoom * zoomOrigin.y
        return {
            heatmap: `matrix(${zoom} 0 0 ${zoom} ${tx} ${ty})`,
            xAxis: `matrix(${zoom} 0 0 1 ${tx} 25)`,
            yAxis: `matrix(1 0 0 ${zoom} 0 ${ty})`
        }
    }, [zoom, heatmapGrid])

    return (
        <div className="heatmap" ref={containerRef}>
            <svg ref={svgRef} width="100%" height="100%" preserveAspectRatio="none"
                 onMouseDown={onMouseDown}
                 onMouseMove={onMouseMove}
                 onMouseUp={onMouseUp}
                 onWheel={onWheel}>
                <defs>
                    {useMemo(() => (
                        <clipPath id="clip-grid">
                            <rect x={heatmapGrid.left} y={heatmapGrid.top} width={heatmapGrid.width}
                                  height={heatmapGrid.height}/>
                        </clipPath>
                    ), [heatmapGrid])}
                </defs>
                <g clip-path="url(#clip-grid)">
                    <g className="transitioned" transform={transform.heatmap}>
                        <g className="heatmap-layer">
                            {heatmapJsx}
                        </g>
                        {selection ? (
                            <g className="selection-layer">
                                <rect className="selection" {...selection}/>
                                <g className="overlay-layer">
                                    {selectionJsx}
                                </g>
                            </g>
                        ) : null}
                    </g>
                </g>
                <g className="transitioned x-axis" transform={transform.xAxis}>{xAxis}</g>
                <g className="transitioned y-axis" transform={transform.yAxis}>{yAxis}</g>
            </svg>
        </div>
    )
}

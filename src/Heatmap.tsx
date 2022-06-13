import {h} from 'preact'
import {useCallback, useMemo, useRef, useState} from 'preact/hooks'
import {JSXInternal} from 'preact/src/jsx'

import './Heatmap.css'

import {useGlobalState} from './App'
import {useResizeObserver} from './hooks/resizeObserver'
import {Data, Sample} from './types'

type RectBox = { x: number, y: number, width: number, height: number }

const COLUMN_WIDTH = 64
const ROW_HEIGHT = 24

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

function useBuckets(data: Sample[], domain: Partial<DOMRect>, viewport?: Partial<DOMRect>) {
    return useMemo(() => {
        if (viewport === null) {
            return null
        }
        const buckets: Buckets = {}
        const {width, height} = domain
        if (!viewport) {
            for (const sample of data) {
                const x = sample.x * width
                const y = sample.y * height
                const column = Math.floor(x / COLUMN_WIDTH)
                const row = Math.floor(y / ROW_HEIGHT)
                addBucketValue(buckets, column, row, sample)
            }
        } else {
            const {x: minX, y: minY, width: viewWidth, height: viewHeight} = viewport

            const columnWidth = COLUMN_WIDTH * viewWidth / width
            const rowHeight = ROW_HEIGHT * viewHeight / height
            const maxX = viewWidth - columnWidth
            const maxY = viewHeight - rowHeight
            for (const sample of data) {
                const x = (sample.x * width) - minX
                if (x >= 0 && x < maxX) {
                    const y = (sample.y * height) - minY
                    if (y >= 0 && y < maxY) {
                        const column = Math.floor(x / columnWidth)
                        const row = Math.floor(y / rowHeight)
                        addBucketValue(buckets, column, row, sample)
                    }
                }
            }
        }
        return buckets
    }, [data, domain, viewport])
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

    const heatmapRef = useRef<HTMLDivElement>(null)
    const svgRef = useRef<SVGSVGElement>(null)

    const dimensions = useResizeObserver(heatmapRef)

    const [selection, setSelection] = useState<HeatmapSelection | null>(null)
    const [zoom, setZoom] = useState(1)

    const buckets = useBuckets(data, dimensions)

    const overlay = useBuckets(data, dimensions, selection)

    const [cells, zoomed, xAxis, yAxis] = useMemo(() => {
        const columns = Math.floor(dimensions.width / COLUMN_WIDTH)
        const rows = Math.floor(dimensions.height / ROW_HEIGHT)
        const cells: JSXInternal.Element[] = []
        const zoomed: JSXInternal.Element[] = []
        for (let row = 0; row < rows; row++) {
            const y = row * ROW_HEIGHT
            for (let column = 0; column < columns; column++) {
                const x = column * COLUMN_WIDTH
                let value = getValue(buckets, column, row)
                // content: getContent(buckets, gridColumn, gridRow),
                cells.push(<rect
                    fill={`hsl(200,80%,${Math.round(100 - 100 * value)}%)`}
                    x={x}
                    y={y}
                    width={COLUMN_WIDTH}
                    height={ROW_HEIGHT}
                />)
            }
        }
        if (overlay) {
            const columnWidth = selection ? COLUMN_WIDTH * selection.width / dimensions.width : 0
            const rowHeight = selection ? ROW_HEIGHT * selection.height / dimensions.height : 0

            for (const column of Object.keys(overlay).map(Number)) {
                const x = selection.x + column * columnWidth
                for (const row of Object.keys(overlay[column]).map(Number)) {
                    const y = selection.y + row * rowHeight
                    let value = getValue(overlay, column, row)
                    zoomed.push(<rect
                        fill={`hsl(40,80%,${Math.round(100 - 100 * value)}%)`}
                        x={x}
                        y={y}
                        width={columnWidth}
                        height={rowHeight}
                    />)
                }
            }
        }
        const xAxis: JSXInternal.Element[] = []
        for (let column = 0; column < columns; column++) {
            xAxis.push(<text x={column * COLUMN_WIDTH} y={0}>{
                (rangeX.min + rangeX.span * column / columns).toFixed(2)
            }</text>)
        }
        const yAxis: JSXInternal.Element[] = []
        for (let row = 0; row < rows; row++) {
            yAxis.push(<text x={0} y={row * ROW_HEIGHT}>{
                (rangeY.min + rangeY.span * row / rows).toFixed(2)
            }</text>)
        }
        return [cells, zoomed, xAxis, yAxis]
    }, [buckets, overlay, dimensions, selection])

    const columnWidth = COLUMN_WIDTH
    const rowHeight = ROW_HEIGHT

    const [zoomOrigin, setZoomOrigin] = useState({x:0, y: 0})

    const clientToSvg = useMemo(()=>{
        if (svgRef.current) {
            let matrix = svgRef.current.getScreenCTM()
            if (zoom !== 1) {
                matrix = matrix
                    .translate(
                        (1 - zoom) * dimensions.width/2 - zoom * zoomOrigin.x,
                        (1 - zoom) * dimensions.height/2 - zoom * zoomOrigin.y
                    )
                    .scale(zoom, zoom)
            }
            return matrix.inverse()
        }
    }, [svgRef.current, dimensions, zoom, zoomOrigin])

    return (
        <div className="heatmap" ref={heatmapRef}>
            <svg ref={svgRef} width="100%" height="100%" preserveAspectRatio="none"
                 onMouseDown={useCallback(({clientX, clientY, shiftKey}) => {
                     if (shiftKey) {
                         const {x, y} = new DOMPointReadOnly(clientX, clientY).matrixTransform(clientToSvg)
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
                         setZoomOrigin({x: clientX - dimensions.width / 2, y: clientY - dimensions.height / 2})
                     }
                 }, [selection, clientToSvg])}
                 onMouseMove={useCallback(({clientX, clientY}) => {
                     const {x, y} = new DOMPointReadOnly(clientX, clientY).matrixTransform(clientToSvg)
                     if (selection?.editing) {
                         const width = Math.max(columnWidth, columnWidth * Math.ceil(x / columnWidth) - selection.x)
                         const height = Math.max(rowHeight, rowHeight * Math.ceil(y / rowHeight) - selection.y)
                         if (width !== selection.width || height !== selection.height) {
                             setSelection({
                                 ...selection,
                                 width,
                                 height,
                                 clientWidth: clientX - selection.clientX,
                                 clientHeight: clientY - selection.clientY,
                             })
                         }
                     }
                     setState({...state, pointer: {...state.pointer, x, y}})
                 }, [state, selection, clientToSvg])}
                 onMouseUp={useCallback(() => {
                     if (selection?.editing) {
                         setSelection({
                             ...selection,
                             editing: false
                         })
                         setZoom(Math.min(
                             dimensions.width / selection.clientWidth,
                             dimensions.height / selection.clientHeight
                         ))
                         setZoomOrigin({
                             x: selection.clientX + (selection.clientWidth - dimensions.width) / 2,
                             y: selection.clientY + (selection.clientHeight - dimensions.height) / 2
                         })
                     }
                 }, [selection])}
                 onWheel={useCallback(event => {
                     if (!event.altKey) {
                         if (event.deltaY > 0) {
                             setZoom(zoom - 0.2)
                             if (zoom <= 1.2) {
                                 setZoomOrigin({x: 0, y: 0})
                             }
                         } else {
                             setZoom(zoom + 0.2)
                         }
                         setState({...state, pointer: {...state.pointer, z: zoom}})
                         event.stopPropagation()
                         event.preventDefault()
                     }
                 }, [state, zoom])}>
                <defs>
                    <filter x="0" y="0" width="1" height="1" id="white-background">
                        <feFlood flood-color="white" result="bg"/>
                        <feMerge>
                            <feMergeNode in="bg"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                <g className="transitioned"
                   style={{'transform': `matrix(${zoom}, 0, 0, ${zoom}, ${(1 - zoom) * dimensions.width/2 - zoom * zoomOrigin.x}, ${(1 - zoom) * dimensions.height/2 - zoom * zoomOrigin.y})`}}>
                    <g className="heatmap-layer">
                        {cells}
                    </g>
                    {selection ? (
                        <g className="selection-layer">
                            <rect className="selection" {...selection}/>
                            <g className="overlay-layer">
                                {zoomed}
                            </g>
                            <text className="selection-coordinates"
                                  x={selection.x - 10} y={selection.y - 5}
                                  filter="url(#white-background)">
                                {selection.x.toFixed(0)} x {selection.y.toFixed(0)}
                            </text>
                            <text className="selection-coordinates"
                                  x={selection.x + selection.width + 10} y={selection.y + selection.height + 5}
                                  filter="url(#white-background)">
                                {(selection.x + selection.width).toFixed(0)} x {(selection.y + selection.height).toFixed(0)}
                            </text>
                        </g>
                    ) : null}
                    {xAxis}
                    {yAxis}
                </g>
            </svg>
        </div>
    )
}

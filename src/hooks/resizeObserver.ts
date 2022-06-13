import {RefObject} from 'preact'
import {useLayoutEffect, useState} from 'preact/hooks'

const INITIAL_DIMENSIONS = {x:0, y:0, width: 0, height: 0}

export function useResizeObserver({current: heatmap}: RefObject<HTMLDivElement>) {

    const [dimensions, setDimensions] = useState<DOMRect>(INITIAL_DIMENSIONS as DOMRect)

    useLayoutEffect(() => {
        if (heatmap) {
            const observer = new ResizeObserver(() => {
                setDimensions(heatmap.getBoundingClientRect())
            })
            setDimensions(heatmap.getBoundingClientRect())
            observer.observe(heatmap)
            return () => {
                observer.disconnect()
            }
        }
    }, [heatmap])

    return dimensions
}
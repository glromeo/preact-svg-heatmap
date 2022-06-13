import {useMemo} from 'preact/hooks'
import {Data} from './types'

export const useData = () => useMemo<Data>(() => {
    const POINTS = 1000
    const data = new Array(POINTS)
    let d = 0
    for (let p = 0; p < POINTS; p++) {
        data[d++] = {
            name: `p:${p}`,
            x: Math.random(),
            y: Math.random(),
            z: Math.random()
        }
    }
    return data.sort(({x: lx, y: ly}, {x: rx, y: ry}) => lx - rx || ly - ry)
}, [])
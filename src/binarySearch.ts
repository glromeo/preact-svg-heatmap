import {Sample} from './types'

export function findIndex(data: number[], v: number, l = 0, r = data.length - 1): number {
    while (l <= r) {
        let m = (l + r) >> 1

        if (data[m] === v) return m

        if (data[m] < v) {
            l = m + 1
        } else {
            r = m - 1
        }
    }
    return l
}

export function findX(data: Sample[], x: number, l = 0, r = data.length - 1): number {
    while (l <= r) {
        let m = (l + r) >> 1

        if (data[m].x === x) return m

        if (data[m].x < x) {
            l = m + 1
        } else {
            r = m - 1
        }
    }
    return l
}

export function findY(data: Sample[], y: number, t = 0, b = data.length - 1): number {
    while (t <= b) {
        let m = (t + b) >> 1

        if (data[m].y === y) return m

        if (data[m].y < y) {
            t = m + 1
        } else {
            b = m - 1
        }
    }
    return t
}
import {useContext, useEffect, useMemo, useState} from 'preact/hooks'
import {Data} from './types'
import {AppContext} from './App'

export const useData = () => useMemo<Data>(() => {
    const POINTS = 100
    const data = new Array(POINTS)
    let d = 0
    for (let p = 0; p < POINTS; p++) {
        data[d++] = {
            name: `p:${p}`,
            x: Math.random(), // .5 + (.4 + Math.random()*.2-.1) * Math.cos(2 * Math.PI * d / POINTS),
            y: Math.random(), // .5 + (.4 + Math.random()*.2-.1) * Math.sin(2 * Math.PI * d / POINTS),
            z: Math.random()
        }
    }
    return data.sort(({x: lx, y: ly}, {x: rx, y: ry}) => lx - rx || ly - ry)
}, [])

export function createStore<S>(initialState: S, reducer: (state:S, action:any)=>Partial<S>) {
    const store = {
        state: initialState,
        selectors: [],
        dispatch: null
    }
    store.dispatch = function (action: any) {
        store.state = {...store.state, ...reducer(store.state, action)}
        store.selectors.forEach(selector => selector(store.state))
    }
    return store
}

export function useDispatch() {
    return useContext<any>(AppContext).dispatch
}

export function useSelector<S, V>(callback: (state: S) => V): V {
    const {state, selectors} = useContext<any>(AppContext)
    const [value, setValue] = useState<V>(callback(state))
    useEffect(function () {
        let oldValue:V;
        selectors.push(function (state) {
            const newValue = callback(state)
            if (newValue !== oldValue) {
                oldValue = newValue
                setValue(newValue)
            }
        })
    },[])
    return value
}

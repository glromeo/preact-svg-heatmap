import {createContext, h, VNode} from 'preact'
import {useContext, useMemo, useState} from 'preact/hooks'
import {Heatmap} from './Heatmap'
import './App.css'
import {AppState} from './types'
import {useData} from './hooks'

interface Props {
    color?: string;
}

const initialState = {
    pointer: {
        x: 0,
        y: 0,
        z: 1
    }
}

export const AppContext = createContext(null)

export function useGlobalState() {
    return useContext(AppContext)
}

export default function App(props: Props): VNode {

    const [state, setState] = useState<AppState>(initialState)

    const data = useData()

    const ranges = useMemo(() => {
        let minX = 1, maxX = 0
        for (const {x} of data) {
            if (x < minX) {
                minX = x
            } else if (x > maxX) {
                maxX = x
            }
        }
        let minY = 1, maxY = 0
        for (const {y} of data) {
            if (y < minY) {
                minY = y
            } else if (y > maxY) {
                maxY = y
            }
        }
        return {
            x: {
                min: minX,
                max: maxX,
                span: maxX - minX
            },
            y: {
                min: minY,
                max: maxY,
                span: maxY - minY
            }
        }
    }, [data])

    const {pointer} = state
    return (
        <AppContext.Provider value={[state, setState]}>
            <div className="App">
                <div className="Header">
                    <div>
                        <span>x:</span>
                        <span>{pointer.x}</span>
                    </div>
                    <div>
                        <span>y:</span>
                        <span>{pointer.y}</span>
                    </div>
                    <div>
                        <span>z:</span>
                        <span>{pointer.z}</span>
                    </div>
                </div>
                <div className="Body">
                    <Heatmap data={data} ranges={ranges}/>
                </div>
            </div>
        </AppContext.Provider>
    )
}

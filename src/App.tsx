import {createContext, h, VNode} from 'preact'
import {Heatmap, HeatmapView} from './Heatmap'
import './App.css'
import {AppState} from './types'
import {createStore, useData, useSelector} from './hooks'
import {useState} from 'preact/hooks'

interface Props {
  color?: string;
}

const store = createStore({
  pointer: {
    x: 0,
    y: 0,
    z: 1
  },
  view: {
    originX: 0,
    originY: 0,
    centerX: 0,
    centerY: 0,
    scaleX: 1,
    scaleY: 1
  } as HeatmapView
}, (state, action) => {
  switch (action.type) {
    case 'SET_POINTER':
      return {
        pointer: action.payload
      }
    case 'SET_VIEW':
      return {
        view: action.payload
      }
  }
  return state
})

Object.defineProperty(window, 'store', {enumerable: true, value: store})
Object.defineProperty(window, 'dispatch', {enumerable: true, value: store.dispatch.bind(store)})

export const AppContext = createContext(store)

function Header({state, onChange}:{state:any, onChange:any}) {
  const pointer = useSelector<AppState, AppState['pointer']>(state => state.pointer)
  const view = useSelector<AppState, AppState['view']>(state => state.view)
  return <div className="Header">
    <div>
      <span>x:</span>
      <span>{Number(pointer.x).toFixed(3)}</span>
    </div>
    <div>
      <span>y:</span>
      <span>{Number(pointer.y).toFixed(3)}</span>
    </div>
    {/*<div>*/}
    {/*    <span>X:</span>*/}
    {/*    <span>{Number(pointer.X).toFixed(3)}</span>*/}
    {/*</div>*/}
    {/*<div>*/}
    {/*    <span>Y:</span>*/}
    {/*    <span>{Number(pointer.Y).toFixed(3)}</span>*/}
    {/*</div>*/}
    {/*<div>*/}
    {/*    <span>originX:</span>*/}
    {/*    <span>{Number(view.originX).toFixed(3)}</span>*/}
    {/*</div>*/}
    {/*<div>*/}
    {/*    <span>originY:</span>*/}
    {/*    <span>{Number(view.originY).toFixed(3)}</span>*/}
    {/*</div>*/}
    {/*<div>*/}
    {/*    <span>centerX:</span>*/}
    {/*    <span>{Number(view.centerX).toFixed(3)}</span>*/}
    {/*</div>*/}
    {/*<div>*/}
    {/*    <span>centerY:</span>*/}
    {/*    <span>{Number(view.centerY).toFixed(3)}</span>*/}
    {/*</div>*/}
    {/*<div>*/}
    {/*    <span>scaleX:</span>*/}
    {/*    <span>{Number(view.scaleX).toFixed(3)}</span>*/}
    {/*</div>*/}
    {/*<div>*/}
    {/*    <span>scaleY:</span>*/}
    {/*    <span>{Number(view.scaleY).toFixed(3)}</span>*/}
    {/*</div>*/}
    <div>
      <input type="checkbox" id="buckets" name="buckets" checked={state.buckets} onChange={onChange}/>
      <label htmlFor="buckets">Buckets</label>
    </div>
    <div>
      <input type="checkbox" id="samples" name="samples" checked={state.samples} onChange={onChange}/>
      <label htmlFor="samples">Samples</label>
    </div>
    <div>
      <input type="checkbox" id="badges" name="badges" checked={state.badges} onChange={onChange}/>
      <label htmlFor="badges">Badges</label>
    </div>
  </div>
}

export default function App(props: Props): VNode {

  const data = useData()
  const [state, setState] = useState<any>({
    buckets: true,
    badges: true,
    samples: true
  });

  return (
    <AppContext.Provider value={store}>
      <div className="App">
        <Header state={state} onChange={event => setState({...state, [event.target.id]: event.target.checked})}/>
        <div className="Body">
          <Heatmap data={data}
                   showTiles={state.buckets}
                   showBadges={state.badges}
                   showBubbles={state.samples}
                   tickX={x => x?.toFixed(3)}
                   tickY={y => y?.toFixed(3)}
          />
        </div>
      </div>
    </AppContext.Provider>
  )
}

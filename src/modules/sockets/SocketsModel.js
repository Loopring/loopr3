import apis from './apis'
const namespace = 'sockets'
let initState = {
  items: [],
  loading: false,
  loaded: false,
  page:{
    total:0,
    size:10,
    current:0,
  },
  sort:{},
  filters:{},
}
export default {
  namespace,
  state: {
    'url':'//relay1.loopring.io',
    'socket':null,
    'assets':{...initState},
    'prices':{...initState},
  },
  effects: {
    *connect({payload},{call,select,put}){
      const {url} = yield select(({ [namespace]:model }) => model )
      const socket = yield call(apis.connect, {url})
      yield put({type:'socketChange',payload:{socket}})
    },
    *urlChange({payload},{call,select,put}){
      yield put({type:'urlChangeStart',payload})
      yield put({type:'connect',payload})
    },
    *fetch({payload},{call,select,put}){
      yield put({type:'emitEvent',payload})
      yield put({type:'onEvent',payload})
    },
    *pageChange({payload},{call,select,put}){
      yield put({type:'pageChangeStart',payload})
      yield put({type:'emitEvent',payload})
    },
    *filtersChange({payload},{call,select,put}){
      yield put({type:'filtersChangeStart',payload})
      yield put({type:'emitEvent',payload})
    },
    *sortChange({payload},{call,select,put}){
      yield put({type:'sortChangeStart',payload})
      yield put({type:'emitEvent',payload})
    },
    *queryChange({payload},{call,select,put}){
      yield put({type:'queryChangeStart',payload})
      yield put({type:'emitEvent',payload})
    },
    *emitEvent({ payload={} },{call,select,put}) {
      let {id} = payload
      const model = yield select(({ [namespace]:model }) => model )
      const socket = model.socket
      const {page,filters,sort} = model[id]
      let new_payload = {page,filters,sort,socket,id}
      const res = yield call(apis.emitEvent, new_payload)
      if (res && res.items) {
        yield put({
          type: 'fetchSuccess',
          payload: {
            id:payload.id,
            // page:{
            //   ...page,
            //   ...res.page,
            // },
            items:res.items,
            loading: false,
            loaded:true
          },
        })
      }
    },
    *onEvent({ payload={} }, { call, select, put }) {
      let {id} = payload
      const model = yield select(({ [namespace]:model }) => model )
      const socket = model.socket
      const {page,filters,sort} = model[id]
      let new_payload = {page,filters,sort,socket,id}
      const res = yield call(apis.onEvent, new_payload)
      if (res && res.items) {
        yield put({
          type: 'fetchSuccess',
          payload: {
            id:payload.id,
            // page:{
            //   ...page,
            //   ...res.page,
            // },
            items:res.items,
            loading: false,
            loaded:true
          },
        })
      }
    },
  },
  reducers: {
    urlChangeStart(state, action){
      let {payload} = action
      return {
        ...state,
        ...payload
      }
    },
    socketChange(state, action){
      let {payload} = action
      return {
        ...state,
        ...payload
      }
    },
    fetchStart(state, action) {
      let {payload} = action
      let {id} = payload
      return {
        ...state,
        [id]:{
          loading: true, loaded:false,
          ...state[id],
        }
      }
    },
    fetchSuccess(state, action) {
      let {payload} = action
      let {id} = payload
      return {
        ...state,
        [id]:{
          ...state[id],
          ...payload,
        },
      }
    },
    pageChangeStart(state,action){
      let {payload} = action
      let {id} = payload
      return {
        ...state,
        [id]:{
          ...state[id],
          page:{
            ...state[id].page,
            ...payload.page
          }
        }
      }
    },
    filtersChangeStart(state,action){
      let {payload} = action
      let {id} = payload
      return {
        ...state,
        [id]:{
          ...state[id],
          filters:{
            ...state[id].filters,
            ...payload.filters,
          },
          page:{
            ...state[id].page,
            current:1,
          }
        }
      }
    },
    sortChangeStart(state,action){
      let {payload} = action
      let {id} = payload
      return {
        ...state,
        [id]:{
          ...state[id],
          sort:{
            // ...state[id].sort,
            ...payload.sort
          }
        }
      }
    },
    queryChangeStart(state,action){
      let {payload} = action
      let {id} = payload
      return {
        ...state,
        [id]:{
          ...state[id],
          filters:{
            ...state[id].filters,
            ...payload.filters,
          },
          page:{
            ...state[id].page,
            current:1,
          },
          sort:{
            // ...state[id].sort,
            ...payload.sort
          },

        }
      }
    },
  },

}


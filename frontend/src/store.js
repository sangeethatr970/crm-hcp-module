import { configureStore, createSlice } from '@reduxjs/toolkit';

const interactionSlice = createSlice({
  name: 'interactions',
  initialState: {
    list: [],
    loading: false,
    selectedInteraction: null,
    agentResponse: null,
  },
  reducers: {
    setInteractions: (state, action) => { state.list = action.payload; },
    setLoading: (state, action) => { state.loading = action.payload; },
    setSelectedInteraction: (state, action) => { state.selectedInteraction = action.payload; },
    setAgentResponse: (state, action) => { state.agentResponse = action.payload; },
    addInteraction: (state, action) => { state.list.unshift(action.payload); },
    updateInteraction: (state, action) => {
      const index = state.list.findIndex(i => i.id === action.payload.id);
      if (index !== -1) state.list[index] = action.payload;
    },
    removeInteraction: (state, action) => {
      state.list = state.list.filter(i => i.id !== action.payload);
    },
  },
});

export const {
  setInteractions, setLoading, setSelectedInteraction,
  setAgentResponse, addInteraction, updateInteraction, removeInteraction
} = interactionSlice.actions;

export default configureStore({
  reducer: { interactions: interactionSlice.reducer }
});
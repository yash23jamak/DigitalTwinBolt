import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DigitalTwinModel } from '../../types';

interface ModelState {
  models: DigitalTwinModel[];
  selectedModel: DigitalTwinModel | null;
  loading: boolean;
  error: string | null;
}

const initialState: ModelState = {
  models: [],
  selectedModel: null,
  loading: false,
  error: null,
};

export const modelSlice = createSlice({
  name: 'models',
  initialState,
  reducers: {
    setModels: (state, action: PayloadAction<DigitalTwinModel[]>) => {
      state.models = action.payload;
    },
    selectModel: (state, action: PayloadAction<DigitalTwinModel>) => {
      state.selectedModel = action.payload;
    },
    // Add more reducers as needed
  },
});

export const { setModels, selectModel } = modelSlice.actions;
export default modelSlice.reducer;
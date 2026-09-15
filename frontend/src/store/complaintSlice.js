import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export const analyzeChange = createAsyncThunk(
  "coordination/analyzeChange",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/analyze-change`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(
          data.detail || "Coordination analysis failed"
        );
      }

      return data;
    } catch (error) {
      return rejectWithValue(
        error.message ||
          "Unable to connect to coordination backend"
      );
    }
  }
);

const coordinationSlice = createSlice({
  name: "coordination",
  initialState: {
    data: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearAnalysis: (state) => {
      state.data = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(analyzeChange.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(analyzeChange.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(analyzeChange.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Analysis failed";
      });
  },
});

export const { clearAnalysis } =
  coordinationSlice.actions;

export default coordinationSlice.reducer;
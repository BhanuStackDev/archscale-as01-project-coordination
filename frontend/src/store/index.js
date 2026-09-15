import { configureStore } from "@reduxjs/toolkit";
import coordinationReducer from "./complaintSlice";

export const store = configureStore({
  reducer: {
    coordination: coordinationReducer,
  },
});
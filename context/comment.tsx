import React, {
  createContext,
  Dispatch,
  FC,
  PropsWithChildren,
  useContext,
  useReducer,
} from "react";

type CommentState = {
  id: string;
  author: string;
  type: string;
  content: string;
};

type CommentAction =
  | { type: "SET_TYPE"; payload: string }
  | { type: "SET_AUTHOR"; payload: string }
  | { type: "SET_CONTENT"; payload: string }
  | { type: "SET_ID"; payload: string }
  | { type: "RESET" };

const initialState: CommentState = {
  id: "",
  author: "",
  type: "",
  content: "",
};

const commentReducer = (
  state: CommentState,
  action: CommentAction
): CommentState => {
  switch (action.type) {
    case "SET_ID":
      return { ...state, id: action.payload };
    case "SET_AUTHOR":
      return { ...state, author: action.payload };
    case "SET_TYPE":
      return { ...state, type: action.payload };
    case "SET_CONTENT":
      return { ...state, content: action.payload };
    case "RESET":
      return initialState;
    default:
      return state;
  }
};

type CommentContextType = {
  state: CommentState;
  dispatch: Dispatch<CommentAction>;
};

const CommentContext = createContext<CommentContextType | undefined>(undefined);

export const CommentProvider: FC<PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(commentReducer, initialState);
  return (
    <CommentContext.Provider value={{ state, dispatch }}>
      {children}
    </CommentContext.Provider>
  );
};

export const useComment = (): CommentContextType => {
  const context = useContext(CommentContext);
  if (!context) {
    throw new Error("useComment must be used within a CommentProvider");
  }
  return context;
};

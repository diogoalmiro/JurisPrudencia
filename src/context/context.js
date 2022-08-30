import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";

const Context = createContext();

export function AppContext({ children }) {
  let value_sidebar = useRef(null)
  let raw_text = useRef(null)
  let rows = useRef([])
  const allEntities = useRef(null)
  const anomTokens = useRef(null)
  const anomValues = useRef(null)
  const last_index = useRef(0)
  const tag = useRef(null)
  const [menuStyle, setMenuStyle] = useState({
    left: 0,
    top: 0,
    showMenu: false
  })
  let selected = useRef([])
  const [mode, setMode] = useState("Anom")
  const [renderValue, setRenderValue] = useState({
    anomTokens: null,
    anomValues: null,
    allEntities: null
  })
  const [file, setFile] = useState()
  let [sourceHtml, setSourceHtml] = useState(null)
  const [redirect, setRedirect] = useState()

  const [loading, setLoading] = useState(false)

  const [popUpMenu, setPopUpMenu] = useState({
    showMenu: false,
    entities: {
      "PER":0,
      "DAT":0,
      "ORG":0,
      "LOC":0,
      "PRO":0,
      "MAT":0
    }
  })

  const f_value = useMemo(() => ({
    value_sidebar,
    allEntities,
    anomTokens,
    anomValues,
    last_index,
    tag,
    menuStyle,
    setMenuStyle,
    selected,
    popUpMenu,
    setPopUpMenu,
    mode,
    setMode,
    rows,
    raw_text,
    renderValue,
    setRenderValue,
    file,
    setFile,
    redirect,
    setRedirect,
    sourceHtml,
    setSourceHtml,
    loading,
    setLoading,
  }));

  return <Context.Provider value={f_value}>{children}</Context.Provider>;
}

export function useAppContext() {
  return useContext(Context);
}
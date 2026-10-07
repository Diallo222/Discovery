import { useEffect } from "react";
import { useStore } from "./lib/store";
import { field } from "./lib/field";
import { switchMode } from "./lib/mode";
import { readUrl } from "./lib/url";
import Field from "./gl/Field";
import Preloader from "./ui/Preloader";
import Intro from "./ui/Intro";
import Hud from "./ui/Hud";
import IndexView from "./ui/IndexView";
import Detail from "./ui/Detail";
import SearchOverlay from "./ui/SearchOverlay";
import Info from "./ui/Info";
import Shutter from "./ui/Shutter";
import Cursor from "./ui/Cursor";
import Toast from "./ui/Toast";
import DevelopCard from "./ui/DevelopCard";

export default function App() {
  const mode = useStore((s) => s.mode);

  useEffect(() => {
    const { query, color } = readUrl();
    useStore.getState().search(query, color);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.mode = mode;
  }, [mode]);

  // Any overlay takes the field's input away.
  useEffect(
    () =>
      useStore.subscribe((s) => {
        field.locked = Boolean(s.searchOpen || s.infoOpen || s.selected);
      }),
    []
  );

  return (
    <>
      <button className="skip-link" onClick={() => switchMode("index")}>
        Skip to the accessible index
      </button>
      <Field />
      <IndexView />
      <Intro />
      <DevelopCard />
      <Hud />
      <Detail />
      <SearchOverlay />
      <Info />
      <Toast />
      <Shutter />
      <Preloader />
      <Cursor />
      <div className="grain" aria-hidden="true" />
    </>
  );
}

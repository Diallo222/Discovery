import { useStore } from "../lib/store";

export default function Toast() {
  const notice = useStore((s) => s.notice);
  const error = useStore((s) => s.error);
  const status = useStore((s) => s.status);
  const loaded = useStore((s) => s.loaded);
  const message = notice || (status === "error" && loaded ? error : null);
  return message ? (
    <p className="toast mono" role="status" key={message}>
      {message}
    </p>
  ) : null;
}

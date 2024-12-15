import { useState } from "react";

export default function useUpdate<T>() {
  const [_, setUpdate] = useState<T>();
  return {
    update: setUpdate,
    forceUpdate: () => setUpdate([] as T),
  };
}

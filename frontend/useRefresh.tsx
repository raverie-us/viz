import React from "react";
let changeCounter = 0;

export const useRefresh = () => {
  const setChangeCounter = React.useState(0)[1];
  return () => {
    ++changeCounter;
    setChangeCounter(changeCounter);
  };
}

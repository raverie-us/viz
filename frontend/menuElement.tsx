export type CommandCallback = () => void;

export interface MenuElement {
  name: string;
  menuElements?: MenuElement[];
  onClick?: CommandCallback;
};

const mergeCallbacks = (callback1?: CommandCallback, callback2?: CommandCallback): CommandCallback | undefined => {
  // If both have callbacks, run the first then the second
  if (callback1 && callback2) {
    return () => {
      callback1();
      callback2();
    };
  }
  return callback1 || callback2;
};

export const mergeMenuElements = (base?: MenuElement[], added?: MenuElement[]) => {
  if (!base || !added) {
    return [];
  }
  if (!base) {
    return added;
  }
  if (!added) {
    return base;
  }

  const addedCopy = [...added];;

  const result: MenuElement[] = [];
  for (const baseElement of base) {
    const addedElementIndex = addedCopy.findIndex((element) => element.name === baseElement.name);
    if (addedElementIndex !== -1) {
      const addedElement = addedCopy[addedElementIndex];
      result.push({
        name: baseElement.name,
        menuElements: mergeMenuElements(baseElement.menuElements, addedElement.menuElements),
        onClick: mergeCallbacks(baseElement.onClick, addedElement.onClick)
      });
      // Remove the added element so that we don't pick it up again
      // it also leaves us with a leftover array of elements that did not match (new elements)
      addedCopy.splice(addedElementIndex, 1);
    } else {
      result.push(baseElement);
    }
  }

  // If we have more elements to add, add a divider
  if (addedCopy.length > 0) {
    // divider
  }

  // Add the remaining elements to the end
  result.push(...addedCopy);
  return result;
}
  

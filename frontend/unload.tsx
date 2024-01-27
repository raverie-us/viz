export let hasUnsavedChanges = false;

window.addEventListener("beforeunload", (e) => {
  const discardChangesMessage = "Do you want to leave this page and discard any changes?";
  if (hasUnsavedChanges) {
    (e || window.event).returnValue = discardChangesMessage;
    return discardChangesMessage;
  }
  return undefined;
});

export const setHasUnsavedChanges = (value: boolean) => {
  hasUnsavedChanges = value;
};

import {capitalCase} from "change-case";

export const capCase = (text: string) => {
  // We only cap case if the first letter is lowercase
  if (text[0] && text[0].toLowerCase() === text[0]) {
    return capitalCase(text);
  }
  return text;
}
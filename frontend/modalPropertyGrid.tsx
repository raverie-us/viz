import React from "react";
import {Modal} from "./modal";
import {propertiesFromObject, PropertyGrid} from "./propertyGrid";
import {cloneObject} from "./utility";

export type GenericObject = Record<string, any>;

export interface ModalPropertyGridSettings<T extends GenericObject> {
  name: string;
  object: T;
  onChanged?: (newValue: T) => void;
}

const PropertyGridWithObject: React.FC<ModalPropertyGridSettings<GenericObject>> = (props) => {
  const [tempObject, setTempObject] = React.useState<GenericObject>(JSON.parse(JSON.stringify(props.object)));
  return <PropertyGrid
    properties={propertiesFromObject(tempObject)}
    onChanged={() => {
      const newTempObject = {...tempObject};
      setTempObject(newTempObject);
      if (props.onChanged) {
        props.onChanged(newTempObject);
      }
    }}/>;
};

export interface MobilePropertyGridResult<T> {
  value: T;
  success: boolean;
}

export const modalPropertyGrid =
  async <T extends GenericObject>(settings: ModalPropertyGridSettings<T>): Promise<MobilePropertyGridResult<T>> => {
    // Clone the object so we can revert if we cancel
    let clone = cloneObject(settings.object);

    const result = await Modal.confirm(settings.name, () =>
      <PropertyGridWithObject name={settings.name} object={clone} onChanged={(newValue) => {
        clone = newValue as T;
        if (settings.onChanged) {
          settings.onChanged(clone);
        }
      }}/>);

    if (result) {
      return {value: clone, success: true};
    }

    // Fire one more change to indicate that it reverted back to it's original value
    if (settings.onChanged) {
      settings.onChanged(settings.object);
    }
    return {value: settings.object, success: false};
  };


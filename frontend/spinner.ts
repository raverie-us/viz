import {TypedEvent} from "./utility";

export const EVENT_SPINNER_CHANGED = "spinnerChanged";

export interface SpinnerInfo {
  visible: boolean;
  text: string;
}

const DEFAULT_TEXT = "Processing...";

export class Spinner {
  private count = 0;

  private text = DEFAULT_TEXT;

  public setText (text: string) {
    // We only send when it changes, and while the spinner is visible
    if (this.text !== text && this.count !== 0) {
      this.text = text;
      window.dispatchEvent(new TypedEvent<SpinnerInfo>(EVENT_SPINNER_CHANGED, {
        visible: true,
        text: this.text
      }));
    }
  }

  public show (text?: string) {
    if (this.count === 0) {
      if (text) {
        this.text = text;
      }
      window.dispatchEvent(new TypedEvent<SpinnerInfo>(EVENT_SPINNER_CHANGED, {
        visible: true,
        text: this.text
      }));
    }
    ++this.count;
  }

  public hide () {
    if (this.count === 1) {
      console.log("test: spinner.hidden");
      this.text = DEFAULT_TEXT;
      window.dispatchEvent(new TypedEvent<SpinnerInfo>(EVENT_SPINNER_CHANGED, {
        visible: false,
        text: this.text
      }));
    }
    --this.count;
  }
}

export const spinner = new Spinner();

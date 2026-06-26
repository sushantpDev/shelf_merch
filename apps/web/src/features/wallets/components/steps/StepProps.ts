import type { Dispatch } from "react";
import type { WizardAction } from "../../reducer";
import type { WizardState } from "../../types";

export type StepProps = {
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
};

import { createSignal, onCleanup, onMount } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { getValueTransformer } from "./modules/transformers/getValueTransformer";
import { setValueTransformer } from "./modules/transformers/setValueTransformer";
import { validateForm } from "./modules/validateForm";
import { watchValue } from "./modules/watchValue";
import { BetterFormError, BetterFormOptions } from "./types";

export const createBetterForm = <Values extends object>(
  options: BetterFormOptions<Values> = {}
) => {
  const refs: { [key in keyof Values]?: HTMLInputElement } = {};

  const [errors, setErrors] = createStore<BetterFormError<Values>>({});
  const [loading, setLoading] = createSignal(false);

  const _setManuallyEvent = new CustomEvent("set-manually");

  const getAllValues = () => {
    const values: any = {};
    Object.entries(refs).forEach(
      ([key, ref]) => (values[key] = getValueTransformer(ref as HTMLInputElement))
    );
    return values as Values;
  };

  const register = (key: keyof Values) => ({
    ref: (ref: HTMLInputElement) => (refs[key] = ref),
    name: key,
  });

  const watch = <Key extends keyof Values, Value extends Values[Key]>(
    key: Key,
    onChange: (value: Value) => void,
    opts = { callImmediately: true }
  ) => watchValue(refs[key]!, onChange, opts.callImmediately);

  const _validate = (formValues: Values) => validateForm(formValues, options.validators, setErrors);

  const getValue = <Key extends keyof Values, Value extends Values[Key]>(key: Key): Value =>
    getValueTransformer(refs[key]!);

  const setValue = <Key extends keyof Values, Value extends Values[Key]>(key: Key, value: Value) =>
    setValueTransformer(refs[key]!, value, _setManuallyEvent);

  const submit = async () => {
    const _values = getAllValues();
    if (_validate(_values) && options.onSubmit) {
      setLoading(true);
      await options.onSubmit(_values);
      setLoading(false);
    }
  };

  return { register, submit, errors, getValue, setValue, loading, watch, getAllValues };
};

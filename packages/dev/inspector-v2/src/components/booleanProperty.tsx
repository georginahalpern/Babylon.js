// eslint-disable-next-line import/no-internal-modules
import type { Observable } from "core/index";

import { useCallback, useMemo, useState } from "react";
import { useObservableState } from "../hooks/observableHooks";
import { Button, InfoLabel, Input, makeStyles, Slider, Switch, tokens } from "@fluentui/react-components";
import { Copy24Regular } from "@fluentui/react-icons";
import type { SwitchProps } from "@fluentui/react-components";
import type { ChangeEvent, FunctionComponent } from "react";

const useStyles = makeStyles({
    // TODO: probably common
    rootDiv: {
        display: "flex",
        alignItems: "center",
        columnGap: tokens.spacingHorizontalSNudge,
    },
    switch: {
        marginLeft: "auto",
    },
    indicator: {
        marginRight: 0,
    },
    slider: {
        marginLeft: "auto",
        width: "auto",
    },
    input: {
        width: "100px",
        marginLeft: "auto",
    },
});

export type BooleanPropertyProps = {
    label: string;
    description?: string;
    accessor: () => boolean;
    mutator?: (value: boolean) => void;
    observable?: Observable<any>;
};

export const BooleanProperty: FunctionComponent<BasePropertyProps<boolean>> = ({ label, description, accessor, mutator, observable }) => {
    const classes = useStyles();
    const indicatorProps = useMemo<SwitchProps["indicator"]>(() => ({ className: classes.indicator }), [classes.indicator]);

    const value = useObservableState(accessor, observable);

    const onChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            mutator?.(event.target.checked);
        },
        [mutator]
    );

    return (
        <div className={classes.rootDiv}>
            <InfoLabel info={description}>{label}</InfoLabel>
            <Switch className={classes.switch} indicator={indicatorProps} checked={value} onChange={onChange} />
        </div>
    );
};

export type SliderPropertyProps = BasePropertyProps<number> & {
    minimum: number;
    maximum: number;
    step: number;
};

export type BasePropertyProps<T> = {
    label: string;
    description?: string;
    accessor: () => T;
    mutator?: (value: T) => void;
    observable?: Observable<T>;
};

export const SliderProperty: FunctionComponent<SliderPropertyProps> = ({ label, description, accessor, mutator, observable, minimum, maximum, step }) => {
    const classes = useStyles();

    // const value = useObservableState(() => accessor().toString(), observable);
    const [value, setValue] = useState(useObservableState(() => accessor(), observable) ?? maximum);

    const onChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>, data: { value: string | number }) => {
            const newValue = data.value;
            const numeric = Number(newValue);
            if (!Number.isNaN(numeric)) {
                setValue(numeric);
                mutator?.(numeric);
            }
        },
        [mutator]
    );

    return (
        <div className={classes.rootDiv}>
            <InfoLabel info={description}>{label}</InfoLabel>
            <CopyWrapper
                renderInput={() => (
                    <>
                        <Input className={classes.input} type="number" step={step} value={value.toString()} onChange={onChange} />
                        <Slider className={classes.slider} min={minimum} max={maximum} step={step} value={value} onChange={onChange} />
                    </>
                )}
                getValue={() => value.toString()}
            />
        </div>
    );
};

interface CopyWrapperProps {
    renderInput: () => React.ReactNode;
    getValue: () => string;
}

const CopyWrapper: React.FC<CopyWrapperProps> = ({ renderInput, getValue }) => {
    const classes = useStyles();

    const handleCopy = () => {
        const valueToCopy = getValue();
        if (valueToCopy !== "") {
            navigator.clipboard.writeText(valueToCopy).catch((err) => {
                console.error("Copy failed:", err);
            });
        }
    };

    return (
        <div className={classes.rootDiv}>
            {renderInput()}
            <Button icon={<Copy24Regular />} onClick={handleCopy} title="Copy to clipboard" />
        </div>
    );
};

// type SyncedSliderInputProps = {
//     minimum: number;
//     maximum: number;
//     step: number;
//     label: string;
//     initialValue?: number;
//     onChange: (value: number) => void;
//     target?: any;
//     propertyName?: string;
//     // lockObject={this.props.lockObject}
//     // decimalCount={0}
// };

// export const SyncedSliderInput: React.FC<SyncedSliderInputProps> = (props: SyncedSliderInputProps) => {
//     const [value, setValue] = useState(props.initialValue ?? props.target?.[props.propertyName!] ?? props.maximum);

//     const handleSliderChange = (_: any, data: { value: number }) => {
//         setValue(data.value);
//         props.onChange(data.value); // Notify parent
//     };

//     const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const newValue = Number(e.target.value);
//         if (!isNaN(newValue)) {
//             setValue(newValue);
//             props.onChange(newValue); // Notify parent
//         }
//     };

//     return (
//         <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
//             <Slider min={props.minimum} max={props.maximum} step={props.step} value={value} onChange={handleSliderChange} />
//             <Input type="number" value={value.toString()} onChange={handleInputChange} />
//         </div>
//     );
// };

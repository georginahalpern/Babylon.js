import { InputProps, makeStyles, Slider, SliderProps } from "@fluentui/react-components";
import { Input } from "./input";
import { FunctionComponent, useEffect, useState } from "react";

const useSyncedSliderStyles = makeStyles({
    syncedSlider: {
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        width: "100%", // Only fill available space
    },
    slider: {
        flexGrow: 1, // Let slider grow
        minWidth: 0, // Allow shrink if needed
    },
    input: {
        width: "80px", // Fixed width for number input
        flexShrink: 0,
    },
});

export type SyncedSliderProps = Omit<InputProps & SliderProps, "onChange" | "value"> & {
    onChange: (value: number) => void; // Callback to notify parent of value change, override both of the slider/input handlers
    value: number; // Controlled value for the slider and input
    centerAtZeroWithRange?: number; // Optional prop to center the slider at zero with the specified range
};

/**
 * Component which synchronizes a slider and an input field, allowing the user to change a value using either control
 * @param props
 * @returns
 */
export const SyncedSliderInput: FunctionComponent<SyncedSliderProps> = (props: SyncedSliderProps) => {
    const styles = useSyncedSliderStyles();
    const [value, setValue] = useState<number>(props.value);
    const [range, setRange] = useState({
        min: props.centerAtZeroWithRange !== undefined ? -props.centerAtZeroWithRange : props.min,
        max: props.centerAtZeroWithRange !== undefined ? props.centerAtZeroWithRange : props.max,
    });
    const handleSliderChange = (_: any, data: { value: number }) => {
        setValue(data.value);
        props.onChange(data.value); // Notify parent
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = Number(e.target.value);
        if (!isNaN(newValue)) {
            setValue(newValue);
            props.onChange(newValue); // Notify parent
        }
    };

    // Expand range symmetrically around 0 only if value exceeds it (assuming centerAtZero is true)
    props.centerAtZeroWithRange !== undefined &&
        useEffect(() => {
            if (props.centerAtZeroWithRange === undefined || range.min === undefined || range.max === undefined) {
                return;
            }
            if (value < range.min || value > range.max) {
                const newBound = Math.ceil(Math.abs(value) / 10) * 10 + props.centerAtZeroWithRange;
                setRange({ min: -newBound, max: newBound });
            }
        }, [value, props.centerAtZeroWithRange, range.min, range.max]);

    return (
        <div className={styles.syncedSlider}>
            <Slider {...props} min={range.min} max={range.max} className={styles.slider} value={value} onChange={handleSliderChange} />
            <Input {...props} type="number" value={value.toString()} onChange={handleInputChange} />
        </div>
    );
};
